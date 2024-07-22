import {ComputedNode, SIGNAL, SignalNode} from '../../../../core/primitives/signals';
import {WatchNode} from '../../../../core/primitives/signals/src/watch';
import {ReactiveLViewConsumer} from '../reactive_lview_consumer';
import {assertTNode, assertLView} from '../assert';
import {getFrameworkDIDebugData} from '../debug/framework_injector_profiler';
import {NodeInjector, getNodeInjectorTNode, getNodeInjectorLView} from '../di';
import {REACTIVE_TEMPLATE_CONSUMER, HOST, LView} from '../interfaces/view';
import {EffectHandle} from '../reactivity/effect';
import {isLView} from '../interfaces/type_checks';
import {Injector} from '../../di/injector';

export type SignalGraphNode<T> =
  | SignalNode<T>
  | ComputedNode<T>
  | WatchNode
  | ReactiveLViewConsumer;

export interface DebugSignalNode<T> {
  type: 'signal';
  label: string;
  value: T;
}
export interface DebugEffectNode {
  type: 'effect';
  label: string;
}

export interface DebugComputedNode<T> {
  type: 'computed';
  label: string;
  value: T;
}

export interface DebugTemplateNode {
  type: 'template';
  label: string;
}

export type DebugSignalGraphNode<T> =
  | DebugSignalNode<T>
  | DebugEffectNode
  | DebugComputedNode<T>
  | DebugTemplateNode;

export interface DebugSignalGraphEdge {
  /**
   * Index of a signal node in the `nodes` array that is a consumer of the signal produced by the producer node.
   */
  consumer: number;

  /**
   * Index of a signal node in the `nodes` array that is a producer of the signal consumed by the consumer node.
   */
  producer: number;
}

/**
 * A debug representation of the signal graph.
 */
export interface DebugSignalGraph<T> {
  nodes: DebugSignalGraphNode<T>[];
  edges: DebugSignalGraphEdge[];
}

export function isComputedNode<T>(node: SignalGraphNode<T>): node is ComputedNode<T> {
  return (node as ComputedNode<T>).computation !== undefined;
}

export function isTemplateNode<T>(node: SignalGraphNode<T>): node is ReactiveLViewConsumer {
  return (
    (node as ReactiveLViewConsumer).lView !== undefined &&
    isLView((node as ReactiveLViewConsumer).lView)
  );
}

export function isEffectNode<T>(node: SignalGraphNode<T>): node is WatchNode {
  return (node as WatchNode).cleanupFn !== undefined;
}

/**
 *
 * @param injector
 * @returns Template consumer of given NodeInjector
 */
export function getTemplateConsumer(injector: NodeInjector): ReactiveLViewConsumer | null {
  if (!(injector instanceof NodeInjector)) {
    return null;
  }

  const tNode = getNodeInjectorTNode(injector)!;
  assertTNode(tNode);
  const lView = getNodeInjectorLView(injector)!;
  assertLView(lView);
  const templateLView = lView[tNode.index]!;
  assertLView(templateLView);

  return templateLView[REACTIVE_TEMPLATE_CONSUMER];
}

export function getNodesAndEdgesFromSignalMap(
  signalMap: ReadonlyMap<SignalGraphNode<unknown>, ReadonlySet<SignalGraphNode<unknown>>>,
): {
  nodes: DebugSignalGraphNode<unknown>[];
  edges: DebugSignalGraphEdge[];
} {
  const nodes = Array.from(signalMap.keys());
  const debugSignalGraphNodes = nodes.map((signalGraphNode: SignalGraphNode<unknown>) => {
    if (isComputedNode(signalGraphNode)) {
      return {
        label: signalGraphNode.debugName,
        value: signalGraphNode.value,
        type: 'computed',
      };
    }

    if (isTemplateNode(signalGraphNode)) {
      return {
        label: signalGraphNode.lView?.[HOST]?.tagName?.toLowerCase?.(),
        type: 'template',
      };
    }

    if (isEffectNode(signalGraphNode)) {
      return {
        label: signalGraphNode.debugName,
        type: 'effect',
      };
    }

    return {
      label: signalGraphNode.debugName,
      value: signalGraphNode.value,
      type: 'signal',
    };
  }) as DebugSignalGraphNode<unknown>[];

  const edges: DebugSignalGraphEdge[] = [];

  for (const [consumer, producers] of signalMap.entries()) {
    for (const producer of producers) {
      edges.push({consumer: nodes.indexOf(consumer), producer: nodes.indexOf(producer)});
    }
  }

  return {nodes: debugSignalGraphNodes, edges};
}

export function extractEffectsFromInjector(injector: Injector): WatchNode[] {
  let diResolver: Injector | LView<unknown> = injector;
  if (injector instanceof NodeInjector) {
    const lView = getNodeInjectorLView(injector)!;
    diResolver = lView;
  }

  const resolverToEffects = getFrameworkDIDebugData().resolverToEffects as Map<
    Injector | LView<unknown>,
    EffectHandle[]
  >;
  const effects = resolverToEffects.get(diResolver) ?? [];

  return effects.map((effect: EffectHandle) => effect.watcher[SIGNAL]);
}

export function extractSignalNodesAndEdgesFromRoot(
  node: SignalGraphNode<unknown>,
  signalDependenciesMap: Map<SignalGraphNode<unknown>, Set<SignalGraphNode<unknown>>>,
): Map<SignalGraphNode<unknown>, Set<SignalGraphNode<unknown>>> {
  if (signalDependenciesMap.has(node)) {
    return signalDependenciesMap;
  }

  signalDependenciesMap.set(node, new Set());

  const {producerNode} = node;

  for (const producer of producerNode ?? []) {
    signalDependenciesMap.get(node)!.add(producer as SignalNode<unknown>);
    extractSignalNodesAndEdgesFromRoot(producer as SignalNode<unknown>, signalDependenciesMap);
  }

  return signalDependenciesMap;
}

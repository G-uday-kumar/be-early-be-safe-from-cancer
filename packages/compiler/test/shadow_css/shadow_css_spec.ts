/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {shim} from './utils';

describe('ShadowCss', () => {
  it('should handle empty string', () => {
    expect(shim('', 'contenta')).toEqualCss('');
  });

  it('should add an attribute to every rule', () => {
    const css = 'one {color: red;}two {color: red;}';
    const expected = 'one[contenta] {color:red;}two[contenta] {color:red;}';
    expect(shim(css, 'contenta')).toEqualCss(expected);
  });

  it('should handle invalid css', () => {
    const css = 'one {color: red;}garbage';
    const expected = 'one[contenta] {color:red;}garbage';
    expect(shim(css, 'contenta')).toEqualCss(expected);
  });

  it('should add an attribute to every selector', () => {
    const css = 'one, two {color: red;}';
    const expected = 'one[contenta], two[contenta] {color:red;}';
    expect(shim(css, 'contenta')).toEqualCss(expected);
  });

  it('should support newlines in the selector and content ', () => {
    const css = `
      one,
      two {
        color: red;
      }
    `;
    const expected = `
      one[contenta],
      two[contenta] {
        color: red;
      }
    `;
    expect(shim(css, 'contenta')).toEqualCss(expected);
  });

  it('should handle complicated selectors', () => {
    expect(shim('one::before {}', 'contenta')).toEqualCss('one[contenta]::before {}');
    expect(shim('one two {}', 'contenta')).toEqualCss('one[contenta] two[contenta] {}');
    expect(shim('one > two {}', 'contenta')).toEqualCss('one[contenta] > two[contenta] {}');
    expect(shim('one + two {}', 'contenta')).toEqualCss('one[contenta] + two[contenta] {}');
    expect(shim('one ~ two {}', 'contenta')).toEqualCss('one[contenta] ~ two[contenta] {}');
    expect(shim('.one.two > three {}', 'contenta')).toEqualCss(
      '.one.two[contenta] > three[contenta] {}',
    );
    expect(shim('one[attr="value"] {}', 'contenta')).toEqualCss('one[attr="value"][contenta] {}');
    expect(shim('one[attr=value] {}', 'contenta')).toEqualCss('one[attr=value][contenta] {}');
    expect(shim('one[attr^="value"] {}', 'contenta')).toEqualCss('one[attr^="value"][contenta] {}');
    expect(shim('one[attr$="value"] {}', 'contenta')).toEqualCss('one[attr$="value"][contenta] {}');
    expect(shim('one[attr*="value"] {}', 'contenta')).toEqualCss('one[attr*="value"][contenta] {}');
    expect(shim('one[attr|="value"] {}', 'contenta')).toEqualCss('one[attr|="value"][contenta] {}');
    expect(shim('one[attr~="value"] {}', 'contenta')).toEqualCss('one[attr~="value"][contenta] {}');
    expect(shim('one[attr="va lue"] {}', 'contenta')).toEqualCss('one[attr="va lue"][contenta] {}');
    expect(shim('one[attr] {}', 'contenta')).toEqualCss('one[attr][contenta] {}');
    expect(shim('[is="one"] {}', 'contenta')).toEqualCss('[is="one"][contenta] {}');
  });

  it('should handle escaped sequences in selectors', () => {
    expect(shim('one\\/two {}', 'contenta')).toEqualCss('one\\/two[contenta] {}');
    expect(shim('one\\:two {}', 'contenta')).toEqualCss('one\\:two[contenta] {}');
    expect(shim('one\\\\:two {}', 'contenta')).toEqualCss('one\\\\[contenta]:two {}');
    expect(shim('.one\\:two {}', 'contenta')).toEqualCss('.one\\:two[contenta] {}');
    expect(shim('.one\\:\\fc ber {}', 'contenta')).toEqualCss('.one\\:\\fc ber[contenta] {}');
    expect(shim('.one\\:two .three\\:four {}', 'contenta')).toEqualCss(
      '.one\\:two[contenta] .three\\:four[contenta] {}',
    );
  });

  it('should handle pseudo functions correctly', () => {
    // :where()
    expect(shim(':where(.one) {}', 'contenta', 'hosta')).toEqualCss(':where(.one[contenta]) {}');
    expect(shim(':where(div.one span.two) {}', 'contenta', 'hosta')).toEqualCss(
      ':where(div.one[contenta] span.two[contenta]) {}',
    );
    expect(shim(':where(.one) .two {}', 'contenta', 'hosta')).toEqualCss(
      ':where(.one[contenta]) .two[contenta] {}',
    );
    expect(shim(':where(:host) {}', 'contenta', 'hosta')).toEqualCss(':where([hosta]) {}');
    expect(shim(':where(.one) :where(:host) {}', 'contenta', 'hosta')).toEqualCss(
      ':where(.one) :where([hosta]) {}',
    );
    expect(shim(':where(.one :host) {}', 'contenta', 'hosta')).toEqualCss(
      ':where(.one [hosta]) {}',
    );
    expect(shim('div :where(.one) {}', 'contenta', 'hosta')).toEqualCss(
      'div[contenta] :where(.one[contenta]) {}',
    );
    expect(shim(':host :where(.one .two) {}', 'contenta', 'hosta')).toEqualCss(
      '[hosta] :where(.one[contenta] .two[contenta]) {}',
    );
    expect(shim(':where(.one, .two) {}', 'contenta', 'hosta')).toEqualCss(
      ':where(.one[contenta], .two[contenta]) {}',
    );

    // :is()
    expect(shim('div:is(.foo) {}', 'contenta', 'a-host')).toEqualCss('div[contenta]:is(.foo) {}');
    expect(shim(':is(.dark :host) {}', 'contenta', 'a-host')).toEqualCss(':is(.dark [a-host]) {}');
    expect(shim(':host:is(.foo) {}', 'contenta', 'a-host')).toEqualCss('[a-host]:is(.foo) {}');
    expect(shim(':is(.foo) {}', 'contenta', 'a-host')).toEqualCss(':is(.foo[contenta]) {}');
    expect(shim(':is(.foo, .bar, .baz) {}', 'contenta', 'a-host')).toEqualCss(
      ':is(.foo[contenta], .bar[contenta], .baz[contenta]) {}',
    );
    expect(shim(':is(.foo, .bar) :host {}', 'contenta', 'a-host')).toEqualCss(
      ':is(.foo, .bar) [a-host] {}',
    );

    // :is() and :where()
    expect(
      shim(
        ':is(.foo, .bar) :is(.baz) :where(.one, .two) :host :where(.three:first-child) {}',
        'contenta',
        'a-host',
      ),
    ).toEqualCss(
      ':is(.foo, .bar) :is(.baz) :where(.one, .two) [a-host] :where(.three[contenta]:first-child) {}',
    );

    // complex selectors
    expect(shim(':host:is([foo],[foo-2])>div.example-2 {}', 'contenta', 'a-host')).toEqualCss(
      '[a-host]:is([foo],[foo-2]) > div.example-2[contenta] {}',
    );
    expect(shim(':host:is([foo], [foo-2]) > div.example-2 {}', 'contenta', 'a-host')).toEqualCss(
      '[a-host]:is([foo], [foo-2]) > div.example-2[contenta] {}',
    );
    expect(shim(':host:has([foo],[foo-2])>div.example-2 {}', 'contenta', 'a-host')).toEqualCss(
      '[a-host]:has([foo],[foo-2]) > div.example-2[contenta] {}',
    );
    expect(shim(':host:is([foo], [foo-2]) > div.example-2 {}', 'contenta', 'a-host')).toEqualCss(
      '[a-host]:is([foo], [foo-2]) > div.example-2[contenta] {}',
    );

    // :has()
    expect(shim('div:has(a) {}', 'contenta', 'hosta')).toEqualCss('div[contenta]:has(a) {}');
    expect(shim('div:has(a) :host {}', 'contenta', 'hosta')).toEqualCss('div:has(a) [hosta] {}');
    expect(shim(':has(a) :host :has(b) {}', 'contenta', 'hosta')).toEqualCss(
      ':has(a) [hosta] [contenta]:has(b) {}',
    );
    // Unlike `:is()` or `:where()` the attribute selector isn't placed inside
    // of `:has()`. That is deliberate, `[contenta]:has(a)` would select all
    // `[contenta]` with `a` inside, while `:has(a[contenta])` would select
    // everything that contains `a[contenta]`, targeting elements outside of
    // encapsulated scope.
    expect(shim(':has(a) :has(b) {}', 'contenta', 'hosta')).toEqualCss(
      '[contenta]:has(a) [contenta]:has(b) {}',
    );
  });

  it('should handle escaped selector with space (if followed by a hex char)', () => {
    // When esbuild runs with optimization.minify
    // selectors are escaped: .über becomes .\fc ber.
    // The space here isn't a separator between 2 selectors
    expect(shim('.\\fc ber {}', 'contenta')).toEqual('.\\fc ber[contenta] {}');
    expect(shim('.\\fc ker {}', 'contenta')).toEqual('.\\fc[contenta]   ker[contenta] {}');
    expect(shim('.pr\\fc fung {}', 'contenta')).toEqual('.pr\\fc fung[contenta] {}');
  });

  it('should handle ::shadow', () => {
    const css = shim('x::shadow > y {}', 'contenta');
    expect(css).toEqualCss('x[contenta] > y[contenta] {}');
  });

  it('should leave calc() unchanged', () => {
    const styleStr = 'div {height:calc(100% - 55px);}';
    const css = shim(styleStr, 'contenta');
    expect(css).toEqualCss('div[contenta] {height:calc(100% - 55px);}');
  });

  it('should shim rules with quoted content', () => {
    const styleStr = 'div {background-image: url("a.jpg"); color: red;}';
    const css = shim(styleStr, 'contenta');
    expect(css).toEqualCss('div[contenta] {background-image:url("a.jpg"); color:red;}');
  });

  it('should shim rules with an escaped quote inside quoted content', () => {
    const styleStr = 'div::after { content: "\\"" }';
    const css = shim(styleStr, 'contenta');
    expect(css).toEqualCss('div[contenta]::after { content:"\\""}');
  });

  it('should shim rules with curly braces inside quoted content', () => {
    const styleStr = 'div::after { content: "{}" }';
    const css = shim(styleStr, 'contenta');
    expect(css).toEqualCss('div[contenta]::after { content:"{}"}');
  });

  it('should keep retain multiline selectors', () => {
    // This is needed as shifting in line number will cause sourcemaps to break.
    const styleStr = '.foo,\n.bar { color: red;}';
    const css = shim(styleStr, 'contenta');
    expect(css).toEqual('.foo[contenta], \n.bar[contenta] { color: red;}');
  });

  describe('comments', () => {
    // Comments should be kept in the same position as otherwise inline sourcemaps break due to
    // shift in lines.
    it('should replace multiline comments with newline', () => {
      expect(shim('/* b {c} */ b {c}', 'contenta')).toBe('\n b[contenta] {c}');
    });

    it('should replace multiline comments with newline in the original position', () => {
      expect(shim('/* b {c}\n */ b {c}', 'contenta')).toBe('\n\n b[contenta] {c}');
    });

    it('should replace comments with newline in the original position', () => {
      expect(shim('/* b {c} */ b {c} /* a {c} */ a {c}', 'contenta')).toBe(
        '\n b[contenta] {c} \n a[contenta] {c}',
      );
    });

    it('should keep sourceMappingURL comments', () => {
      expect(shim('b {c} /*# sourceMappingURL=data:x */', 'contenta')).toBe(
        'b[contenta] {c} /*# sourceMappingURL=data:x */',
      );
      expect(shim('b {c}/* #sourceMappingURL=data:x */', 'contenta')).toBe(
        'b[contenta] {c}/* #sourceMappingURL=data:x */',
      );
    });

    it('should handle adjacent comments', () => {
      expect(shim('/* comment 1 */ /* comment 2 */ b {c}', 'contenta')).toBe(
        '\n \n b[contenta] {c}',
      );
    });
  });
});

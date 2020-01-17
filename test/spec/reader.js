import expect from '../expect';

import {
  Reader
} from '../../lib';

import {
  readFile,
  createModelBuilder
} from '../helper';


describe('Reader', function() {

  const createModel = createModelBuilder('test/fixtures/model/');


  describe('api', function() {

    const model = createModel([ 'properties' ]);


    describe('callback style', function() {

      it('should provide result with context', function(done) {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:ComplexAttrs');

        const xml = '<props:complexAttrs xmlns:props="http://properties"></props:complexAttrs>';

        // when
        reader.fromXML(xml, rootHandler, function(err, result, context) {

          // then
          expect(err).not.to.exist;

          expect(result).to.exist;
          expect(context).to.exist;

          done();
        });
      });


      it('should provide error with context', function(done) {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:ComplexAttrs');

        // when
        reader.fromXML('this-is-garbage', rootHandler, function(err, result, context) {

          // then
          expect(err).to.exist;

          expect(result).not.to.exist;
          expect(context).to.exist;

          done();
        });
      });

    });


    describe('awaitable', function() {

      it('should provide result with context', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:ComplexAttrs');

        const xml = '<props:complexAttrs xmlns:props="http://properties"></props:complexAttrs>';

        // when
        const {
          element,
          context
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.exist;
        expect(context).to.exist;
      });


      it('should provide error with context', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:ComplexAttrs');

        // when
        try {
          await reader.fromXML('this-is-garbage', rootHandler);

          expectedError();
        } catch (error) {

          // then
          expect(error).to.exist;
          expect(error).to.have.property('context');
        }
      });

    });

  });


  describe('should import', function() {

    const model = createModel([ 'properties' ]);
    const extendedModel = createModel([ 'properties', 'properties-extended' ]);


    describe('data types', function() {

      it('simple', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:ComplexAttrs');

        const xml = '<props:complexAttrs xmlns:props="http://properties">' +
                    '<props:attrs integerValue="10" />' +
                  '</props:complexAttrs>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:ComplexAttrs',
          attrs: {
            $type: 'props:Attributes',
            integerValue: 10
          }
        });
      });


      it('simple / xsi:type', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:ComplexAttrs');

        const xml = '<props:complexAttrs xmlns:props="http://properties" ' +
                                      'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
                    '<props:attrs xsi:type="props:SubAttributes" integerValue="10" />' +
                  '</props:complexAttrs>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:ComplexAttrs',
          attrs: {
            $type: 'props:SubAttributes',
            integerValue: 10
          }
        });

      });


      it('simple / xsi:type / default ns', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:ComplexAttrs');

        const xml = '<complexAttrs xmlns="http://properties" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
                    '<attrs xsi:type="SubAttributes" integerValue="10" />' +
                  '</complexAttrs>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:ComplexAttrs',
          attrs: {
            $type: 'props:SubAttributes',
            integerValue: 10
          }
        });
      });


      it('simple / xsi:type / different ns prefix', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:ComplexAttrs');

        const xml = '<a:complexAttrs xmlns:a="http://properties" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
                    '<a:attrs xsi:type="a:SubAttributes" integerValue="10" />' +
                  '</a:complexAttrs>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:ComplexAttrs',
          attrs: {
            $type: 'props:SubAttributes',
            integerValue: 10
          }
        });

      });


      it('collection / no xsi:type', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:ComplexAttrsCol');

        const xml = '<props:complexAttrsCol xmlns:props="http://properties">' +
                    '<props:attrs integerValue="10" />' +
                    '<props:attrs booleanValue="true" />' +
                  '</props:complexAttrsCol>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:ComplexAttrsCol',
          attrs: [
            { $type: 'props:Attributes', integerValue: 10 },
            { $type: 'props:Attributes', booleanValue: true }
          ]
        });
      });


      it('collection / xsi:type / from other namespace)', async function() {

        const datatypeModel = createModel(['datatype', 'datatype-external']);

        // given
        const reader = new Reader(datatypeModel);
        const rootHandler = reader.handler('dt:Root');

        const xml =
          '<dt:root xmlns:dt="http://datatypes" xmlns:do="http://datatypes2" ' +
                   'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
            '<dt:otherBounds xsi:type="dt:Rect" y="100" />' +
            '<dt:otherBounds xsi:type="do:Rect" x="200" />' +
          '</dt:root>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'dt:Root',
          otherBounds: [
            { $type: 'dt:Rect', y: 100 },
            { $type: 'do:Rect', x: 200 }
          ]
        });
      });


      it('collection / xsi:type / from other namespace / default ns)', async function() {

        const datatypeModel = createModel(['datatype', 'datatype-external']);

        // given
        const reader = new Reader(datatypeModel);
        const rootHandler = reader.handler('dt:Root');

        const xml =
          '<root xmlns="http://datatypes" xmlns:do="http://datatypes2" ' +
                'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
            '<otherBounds xsi:type="Rect" y="100" />' +
            '<otherBounds xsi:type="do:Rect" x="200" />' +
          '</root>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'dt:Root',
          otherBounds: [
            { $type: 'dt:Rect', y: 100 },
            { $type: 'do:Rect', x: 200 }
          ]
        });
      });


      it('collection / xsi:type / type alias', async function() {

        const datatypeModel = createModel(['datatype', 'datatype-aliased']);

        // given
        const reader = new Reader(datatypeModel);
        const rootHandler = reader.handler('dt:Root');

        const xml =
          '<root xmlns="http://datatypes" xmlns:da="http://datatypes-aliased" ' +
                'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
            '<otherBounds xsi:type="dt:Rect" y="100" />' +
            '<otherBounds xsi:type="da:tRect" z="200" />' +
          '</root>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'dt:Root',
          otherBounds: [
            { $type: 'dt:Rect', y: 100 },
            { $type: 'da:Rect', z: 200 }
          ]
        });
      });


      it('collection / xsi:type / unknown type', async function() {

        const datatypeModel = createModel([ 'datatype' ]);

        // given
        const reader = new Reader(datatypeModel);
        const rootHandler = reader.handler('dt:Root');

        const xml =
          '<root xmlns="http://datatypes" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
            '<otherBounds xsi:type="Unknown" y="100" />' +
          '</root>';

        // when
        try {
          await reader.fromXML(xml, rootHandler);

          expectedError();
        } catch (error) {
          expect(error.message).to.contain('unparsable content <otherBounds> detected');
        }
      });


      it('generic, non-ns elements', async function() {

        const extensionModel = createModel([ 'extension/base' ]);

        // given
        const reader = new Reader(extensionModel);
        const rootHandler = reader.handler('b:Root');

        const xml =
          '<b:Root xmlns:b="http://base">' +
            '<Any foo="BAR" />' +
          '</b:Root>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        expect(element).to.jsonEqual({
          $type: 'b:Root',
          generic: {
            $type: 'Any',
            foo: 'BAR'
          }
        });
      });

    });


    describe('attributes', function() {

      it('with special characters', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:SimpleBodyProperties');

        const xml = '<props:simpleBodyProperties xmlns:props="http://properties" str="&#60;&#62;&#10;&#38;" />';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:SimpleBodyProperties',
          str: '<>\n&'
        });
      });


      it('inherited', async function() {

        // given
        const reader = new Reader(extendedModel);
        const rootHandler = reader.handler('ext:Root');

        // when
        const {
          element
        } = await reader.fromXML('<ext:root xmlns:ext="http://extended" id="FOO" />', rootHandler);

        // then
        expect(element).to.jsonEqual({ $type: 'ext:Root', id: 'FOO' });
      });

    });


    describe('simple nested properties', function() {

      it('parse boolean property', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:SimpleBodyProperties');

        const xml = '<props:simpleBodyProperties xmlns:props="http://properties">' +
                    '<props:intValue>5</props:intValue>' +
                  '</props:simpleBodyProperties>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:SimpleBodyProperties',
          intValue: 5
        });
      });


      it('parse boolean property', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:SimpleBodyProperties');

        const xml = '<props:simpleBodyProperties xmlns:props="http://properties">' +
                    '<props:boolValue>false</props:boolValue>' +
                  '</props:simpleBodyProperties>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:SimpleBodyProperties',
          boolValue: false
        });
      });


      it('parse string isMany prooperty', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:SimpleBodyProperties');

        const xml = '<props:simpleBodyProperties xmlns:props="http://properties">' +
                    '<props:str>A</props:str>' +
                    '<props:str>B</props:str>' +
                    '<props:str>C</props:str>' +
                  '</props:simpleBodyProperties>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:SimpleBodyProperties',
          str: [ 'A', 'B', 'C' ]
        });
      });


      it('should not discard value with an empty tag', async function() {

        // given
        const reader = new Reader(createModel([ 'replace' ]));
        const rootHandler = reader.handler('r:Extension');

        const xml = '<r:Extension xmlns:r="http://replace">' +
                    '<r:value></r:value>' +
                  '</r:Extension>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'r:Extension',
          value: ''
        });
      });

    });


    describe('body text', function() {

      it('parse body text property', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:SimpleBody');

        const xml = '<props:simpleBody xmlns:props="http://properties">textContent</props:simpleBody>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:SimpleBody',
          body: 'textContent'
        });
      });


      it('parse body text property / encoded', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:SimpleBody');

        const xml = (
          '<props:simpleBody xmlns:props="http://properties">' +
            '&lt; 10, &gt; 20, &amp;nbsp;' +
          '</props:simpleBody>'
        );

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:SimpleBody',
          body: '< 10, > 20, &nbsp;'
        });
      });


      it('parse body text property / trimmed whitespace', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:SimpleBody');

        const xml = '<props:simpleBody xmlns:props="http://properties">    </props:simpleBody>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:SimpleBody'
        });
      });


      it('parse body CDATA property / trimmed whitespace', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:SimpleBody');

        const xml = '<props:simpleBody xmlns:props="http://properties">' +
                  '   <![CDATA[<h2>HTML markup</h2>]]>' +
                  '</props:simpleBody>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:SimpleBody',
          body: '<h2>HTML markup</h2>'
        });
      });

    });


    describe('alias', function() {

      it('lowerCase', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:Root');

        // when
        const {
          element
        } = await reader.fromXML('<props:root xmlns:props="http://properties" />', rootHandler);

        // then
        expect(element).to.jsonEqual({ $type: 'props:Root' });
      });


      it('none', async function() {

        // given
        const noAliasModel = createModel(['noalias']);

        const reader = new Reader(noAliasModel);
        const rootHandler = reader.handler('na:Root');

        // when
        const {
          element
        } = await reader.fromXML('<na:Root xmlns:na="http://noalias" />', rootHandler);

        // then
        expect(element).to.jsonEqual({ $type: 'na:Root' });
      });

    });


    describe('reference', function() {

      it('single', async function() {

        // given
        const reader = new Reader(extendedModel);
        const rootHandler = reader.handler('props:Root');

        const xml =
          '<props:root xmlns:props="http://properties">' +
            '<props:containedCollection id="C_5">' +
              '<props:complex id="C_1" />' +
              '<props:complex id="C_2" />' +
            '</props:containedCollection>' +
            '<props:referencingSingle id="C_4" referencedComplex="C_1" />' +
          '</props:root>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:Root',
          any: [
            {
              $type: 'props:ContainedCollection',
              id: 'C_5',
              children: [
                { $type: 'props:Complex', id: 'C_1' },
                { $type: 'props:Complex', id: 'C_2' }
              ]
            },
            { $type: 'props:ReferencingSingle', id: 'C_4' }
          ]
        });

        const referenced = element.any[0].children[0];
        const referencingSingle = element.any[1];

        expect(referencingSingle.referencedComplex).to.equal(referenced);
      });


      it('collection', async function() {

        // given
        const reader = new Reader(extendedModel);
        const rootHandler = reader.handler('props:Root');

        const xml =
          '<props:root xmlns:props="http://properties">' +
            '<props:containedCollection id="C_5">' +
              '<props:complex id="C_1" />' +
              '<props:complex id="C_2" />' +
            '</props:containedCollection>' +
            '<props:referencingCollection id="C_4">' +
              '<props:references>C_2</props:references>' +
              '<props:references>C_5</props:references>' +
            '</props:referencingCollection>' +
          '</props:root>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:Root',
          any: [
            {
              $type: 'props:ContainedCollection',
              id: 'C_5',
              children: [
                { $type: 'props:Complex', id: 'C_1' },
                { $type: 'props:Complex', id: 'C_2' }
              ]
            },
            { $type: 'props:ReferencingCollection', id: 'C_4' }
          ]
        });

        const containedCollection = element.any[0];
        const complex_c2 = containedCollection.children[1];

        const referencingCollection = element.any[1];

        expect(referencingCollection.references).to.jsonEqual([ complex_c2, containedCollection ]);
      });


      it('attribute collection', async function() {

        // given
        const reader = new Reader(extendedModel);
        const rootHandler = reader.handler('props:Root');

        const xml =
          '<props:root xmlns:props="http://properties">' +
            '<props:containedCollection id="C_5">' +
              '<props:complex id="C_1" />' +
              '<props:complex id="C_2" />' +
              '<props:complex id="C_3" />' +
            '</props:containedCollection>' +
            '<props:attributeReferenceCollection id="C_4" refs="C_2 C_3 C_5" />' +
          '</props:root>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'props:Root',
          any: [
            {
              $type: 'props:ContainedCollection',
              id: 'C_5',
              children: [
                { $type: 'props:Complex', id: 'C_1' },
                { $type: 'props:Complex', id: 'C_2' },
                { $type: 'props:Complex', id: 'C_3' }
              ]
            },
            { $type: 'props:AttributeReferenceCollection', id: 'C_4' }
          ]
        });

        const containedCollection = element.any[0];
        const complex_c2 = containedCollection.children[1];
        const complex_c3 = containedCollection.children[2];

        const attrReferenceCollection = element.any[1];

        expect(attrReferenceCollection.refs).to.jsonEqual([
          complex_c2,
          complex_c3,
          containedCollection
        ]);
      });

    });

  });


  describe('should not import', function() {

    const model = createModel([ 'properties' ]);

    describe('wrong namespace', function() {

      it('same alias', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:Root');

        const xml = '<props:root xmlns:props="http://invalid">' +
                    '<props:referencingSingle id="C_4" />' +
                  '</props:root>';

        // when
        try {
          await reader.fromXML(xml, rootHandler);

          expectedError();
        } catch (err) {
          // then
          expect(err).to.exist;
        }
      });


      it('different alias', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:Root');

        const xml = '<props1:root xmlns:props1="http://invalid">' +
                    '<props1:referencingSingle id="C_4" />' +
                  '</props1:root>';

        // when
        try {
          await reader.fromXML(xml, rootHandler);

          expectedError();
        } catch (err) {
          // then
          expect(err).to.exist;
        }
      });

    });

  });


  describe('internal', function() {

    const extendedModel = createModel([ 'properties', 'properties-extended' ]);


    describe('should identify references', function() {

      it('on attribute', async function() {

        // given
        const reader = new Reader(extendedModel);
        const rootHandler = reader.handler('props:ReferencingSingle');

        const xml = '<props:referencingSingle xmlns:props="http://properties" id="C_4" referencedComplex="C_1" />';

        // when
        const {
          context
        } = await reader.fromXML(xml, rootHandler);

        // then
        const expectedReference = {
          element: {
            $type: 'props:ReferencingSingle',
            id: 'C_4'
          },
          property: 'props:referencedComplex',
          id: 'C_1'
        };

        const references = context.references;

        expect(references).to.jsonEqual([ expectedReference ]);
      });


      it('embedded', async function() {

        // given
        const reader = new Reader(extendedModel);
        const rootHandler = reader.handler('props:ReferencingCollection');

        const xml = '<props:referencingCollection xmlns:props="http://properties" id="C_4">' +
                    '<props:references>C_2</props:references>' +
                    '<props:references>C_5</props:references>' +
                  '</props:referencingCollection>';

        const {
          context
        } = await reader.fromXML(xml, rootHandler);

        const expectedTarget = {
          $type: 'props:ReferencingCollection',
          id: 'C_4'
        };

        const expectedReference1 = {
          property: 'props:references',
          id: 'C_2',
          element: expectedTarget
        };

        const expectedReference2 = {
          property: 'props:references',
          id: 'C_5',
          element: expectedTarget
        };

        const references = context.references;

        expect(references).to.jsonEqual([
          expectedReference1,
          expectedReference2
        ]);
      });

    });

  });


  describe('error handling', function() {

    function expectError(error, expectedMatch) {
      expect(error.message).to.match(expectedMatch);
    }

    function expectWarnings(context, expectedMatches) {
      expect(context.warnings).to.have.length(expectedMatches.length);

      context.warnings.forEach(function(w, idx) {
        expectError(w, expectedMatches[idx]);
      });
    }

    const model = createModel([ 'properties' ]);
    const extendedModel = createModel([ 'properties', 'properties-extended' ]);


    it('should handle non-xml text files', async function() {

      // given
      const data = readFile('test/fixtures/error/no-xml.txt');

      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ComplexAttrs');

      // when
      try {
        await reader.fromXML(data, rootHandler);

        expectedError();
      } catch (err) {

        // then
      }
    });


    it('should handle unexpected text', async function() {

      const xml = '<props:complexAttrs xmlns:props="http://properties">a</props:complexAttrs>';

      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ComplexAttrs');

      // when
      const {
        element,
        context
      } = await reader.fromXML(xml, rootHandler);

      expectWarnings(context, [
        /unexpected body text <a>/
      ]);

      // then
      expect(element).to.jsonEqual({
        $type: 'props:ComplexAttrs'
      });
    });


    it('should handle unexpected CDATA', async function() {

      const xml = '<props:complexAttrs xmlns:props="http://properties"><![CDATA[a]]></props:complexAttrs>';

      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ComplexAttrs');

      // when
      const {
        element,
        context
      } = await reader.fromXML(xml, rootHandler);

      expectWarnings(context, [
        /unexpected body text <a>/
      ]);

      // then
      expect(element).to.jsonEqual({
        $type: 'props:ComplexAttrs'
      });
    });


    it('should handle incomplete attribute declaration', async function() {

      const xml = '<props:complexAttrs xmlns:props="http://properties" foo />';

      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ComplexAttrs');

      // when
      const {
        element,
        context
      } = await reader.fromXML(xml, rootHandler);

      expectWarnings(context, [
        /nested error: missing attribute value/
      ]);

      // then
      expect(element).to.jsonEqual({
        $type: 'props:ComplexAttrs'
      });
    });


    it('should handle attribute re-definition', async function() {

      const xml = '<props:complexAttrs xmlns:props="http://properties" id="A" id="B" />';

      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ComplexAttrs');

      // when
      const {
        element,
        context
      } = await reader.fromXML(xml, rootHandler);

      expectWarnings(context, [
        /nested error: attribute <id> already defined/
      ]);

      // then
      expect(element).to.jsonEqual({
        $type: 'props:ComplexAttrs',
        id: 'A'
      });
    });


    it('should handle unparsable attributes', async function() {

      const xml = '<props:complexAttrs id="A" foo=\'"" />';

      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ComplexAttrs');

      // when
      const {
        element,
        context
      } = await reader.fromXML(xml, rootHandler);

      expectWarnings(context, [
        /nested error: attribute value quote missmatch/,
        /nested error: illegal character after attribute end/
      ]);

      // then
      expect(element).to.jsonEqual({
        $type: 'props:ComplexAttrs',
        id: 'A'
      });
    });


    it('should handle illegal ID attribute', async function() {

      const xml = '<props:complexAttrs id="a&lt;" />';

      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ComplexAttrs');

      // when
      try {
        await reader.fromXML(xml, rootHandler);

        expectedError();
      } catch (error) {

        // then
        expectError(error, /nested error: illegal ID <a<>/);
      }
    });


    it('should handle non-xml binary file', async function() {

      const data = readFile('test/fixtures/error/binary.png');

      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ComplexAttrs');

      // when
      try {
        await reader.fromXML(data, rootHandler);

        expectedError();
      } catch (error) {

        // then
      }

    });


    describe('should handle invalid root element', function() {

      it('wrong type', async function() {

        const xml = '<props:referencingCollection xmlns:props="http://properties" id="C_4">' +
                    '<props:references>C_2</props:references>' +
                    '<props:references>C_5</props:references>' +
                  '</props:referencingCollection>';

        const reader = new Reader(model);
        const rootHandler = reader.handler('props:ComplexAttrs');

        const expectedError =
          'unparsable content <props:referencingCollection> detected\n\t' +
              'line: 0\n\t' +
              'column: 0\n\t' +
              'nested error: unexpected element <props:referencingCollection>';

        // when
        try {
          await reader.fromXML(xml, rootHandler);

          expectedError();
        } catch (error) {

          // then
          expect(error.message).to.eql(expectedError);
        }
      });


      it('wrong uri', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:Root');

        const xml = '<props:root xmlns:props="http://invalid">' +
                    '<props:referencingSingle id="C_4" />' +
                  '</props:root>';

        // when
        try {
          await reader.fromXML(xml, rootHandler);

          expectedError();
        } catch (error) {

          // then
          expect(error.message).to.match(/unexpected element <props:root>/);
        }
      });


      it('unknown uri + prefix', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:Root');

        const xml = '<props1:root xmlns:props1="http://invalid">' +
                    '<props1:referencingSingle id="C_4" />' +
                  '</props1:root>';

        // when
        try {
          await reader.fromXML(xml, rootHandler);

          expectedError();
        } catch (error) {

          // then
          expect(error.message).to.match(/unexpected element <props1:root>/);
        }
      });


      it('missing namespace', async function() {

        // given
        const reader = new Reader(model);
        const rootHandler = reader.handler('props:Root');

        const xml = '<root xmlns:props="http://properties">' +
                    '<referencingSingle id="C_4" />' +
                  '</root>';

        // when
        try {
          await reader.fromXML(xml, rootHandler);

          expectedError();
        } catch (error) {

          // then
          expect(error.message).to.match(/unparsable content <root> detected/);
        }
      });


      it('unparsable root element / lax mode', async function() {

        // given
        const reader = new Reader({ model: model, lax: true });
        const rootHandler = reader.handler('props:Root');

        const xml = '<root xmlns:props="http://properties">' +
                    '<referencingSingle id="C_4" />' +
                  '</root>';

        // when
        try {
          await reader.fromXML(xml, rootHandler);

          expectedError();
        } catch (error) {

          // then
          expect(error.message).to.match(/failed to parse document as <props:Root>/);
        }
      });

    });


    it('should handle invalid child element', async function() {

      const xml = '<props:referencingCollection xmlns:props="http://properties" id="C_4">' +
                  '<props:references>C_2</props:references>' +
                  '<props:invalid>C_5</props:invalid>' +
                '</props:referencingCollection>';

      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ReferencingCollection');

      const expectedError =
        'unparsable content <props:invalid> detected\n\t' +
            'line: 0\n\t' +
            'column: 110\n\t' +
            'nested error: unknown type <props:Invalid>';

      // when
      try {
        await reader.fromXML(xml, rootHandler);

        expectedError();
      } catch (error) {

        // then
        expect(error.message).to.eql(expectedError);
      }
    });


    it('should handle invalid child element / non-model schema', async function() {

      const xml = '<props:referencingCollection xmlns:props="http://properties" xmlns:other="http://other">' +
                  '<other:foo>C_2</other:foo>' +
                '</props:referencingCollection>';

      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ReferencingCollection');

      const expectedError =
        'unparsable content <other:foo> detected\n\t' +
            'line: 0\n\t' +
            'column: 88\n\t' +
            'nested error: unrecognized element <other:foo>';

      // when
      try {
        await reader.fromXML(xml, rootHandler);

        expectedError();
      } catch (error) {

        // then
        expect(error.message).to.eql(expectedError);
      }
    });


    it('should handle duplicate id', async function() {

      const xml = '<props:root xmlns:props="http://properties" id="root">' +
                  '<props:baseWithId id="root" />' +
                '</props:root>';

      const reader = new Reader(model);
      const rootHandler = reader.handler('props:Root');

      const expectedError =
        'unparsable content <props:baseWithId> detected\n\t' +
            'line: 0\n\t' +
            'column: 54\n\t' +
            'nested error: duplicate ID <root>';

      // when
      try {
        await reader.fromXML(xml, rootHandler);

        expectedError();
      } catch (error) {

        // then
        expect(error.message).to.eql(expectedError);
      }
    });


    describe('references', function() {

      describe('should log warning', function() {

        it('on unresolvable reference', async function() {

          // given
          const reader = new Reader(extendedModel);
          const rootHandler = reader.handler('props:Root');

          const xml =
            '<props:root xmlns:props="http://properties">' +
              '<props:referencingSingle id="C_4" referencedComplex="C_1" />' +
            '</props:root>';

          // when
          const {
            element,
            context
          } = await reader.fromXML(xml, rootHandler);

          // then
          expect(element).to.jsonEqual({
            $type: 'props:Root',
            any: [
              { $type: 'props:ReferencingSingle', id: 'C_4' }
            ]
          });

          const referencingSingle = element.any[0];

          expect(referencingSingle.referencedComplex).not.to.exist;

          // expect warning to be logged
          expect(context.warnings).to.eql([
            {
              message : 'unresolved reference <C_1>',
              element : referencingSingle,
              property : 'props:referencedComplex',
              value : 'C_1'
            }
          ]);
        });


        it('on unresolvable collection reference', async function() {

          // given
          const reader = new Reader(extendedModel);
          const rootHandler = reader.handler('props:Root');

          const xml =
            '<props:root xmlns:props="http://properties">' +
              '<props:containedCollection id="C_5">' +
                '<props:complex id="C_2" />' +
              '</props:containedCollection>' +
              '<props:referencingCollection id="C_4">' +
                '<props:references>C_1</props:references>' +
                '<props:references>C_2</props:references>' +
              '</props:referencingCollection>' +
            '</props:root>';

          // when
          const {
            element,
            context
          } = await reader.fromXML(xml, rootHandler);

          // then
          expect(element).to.jsonEqual({
            $type: 'props:Root',
            any: [
              {
                $type: 'props:ContainedCollection',
                id: 'C_5',
                children: [
                  { $type: 'props:Complex', id: 'C_2' }
                ]
              },
              { $type: 'props:ReferencingCollection', id: 'C_4' }
            ]
          });

          // expect invalid reference not to be included
          const c2 = element.any[0].children[0];
          const referencingCollection = element.any[1];

          expect(referencingCollection.references).to.jsonEqual([ c2 ]);

          // expect warning to be logged
          expect(context.warnings).to.jsonEqual([
            {
              message: 'unresolved reference <C_1>',
              element: referencingCollection,
              property : 'props:references',
              value : 'C_1'
            }
          ]);
        });

      });

    });

  });


  describe('lax error handling', function() {

    const model = createModel([ 'properties' ]);


    it('should ignore namespaced invalid child', async function() {

      // given
      const reader = new Reader({ model: model, lax: true });
      const rootHandler = reader.handler('props:ComplexAttrs');

      const xml = '<props:complexAttrs xmlns:props="http://properties">' +
                  '<props:unknownElement foo="bar">' +
                    '<props:unknownChild />' +
                  '</props:unknownElement>' +
                '</props:complexAttrs>';

      const {
        element,
        context
      } = await reader.fromXML(xml, rootHandler);

      // then
      expect(context.warnings).to.have.length(1);

      const warning = context.warnings[0];

      expect(warning.message).to.eql(
        'unparsable content <props:unknownElement> detected\n\t' +
          'line: 0\n\t' +
          'column: 52\n\t' +
          'nested error: unknown type <props:UnknownElement>');

      // then
      expect(element).to.jsonEqual({
        $type: 'props:ComplexAttrs'
      });
    });


    it('should ignore invalid child', async function() {

      // given
      const reader = new Reader({ model: model, lax: true });
      const rootHandler = reader.handler('props:ComplexAttrs');

      const xml = '<props:complexAttrs xmlns:props="http://properties">' +
                  '<unknownElement foo="bar" />' +
                '</props:complexAttrs>';

      const {
        element,
        context
      } = await reader.fromXML(xml, rootHandler);

      // then
      expect(context.warnings).to.have.length(1);

      const warning = context.warnings[0];

      expect(warning.message).to.eql(
        'unparsable content <unknownElement> detected\n\t' +
          'line: 0\n\t' +
          'column: 52\n\t' +
          'nested error: unrecognized element <unknownElement>');

      // then
      expect(element).to.jsonEqual({
        $type: 'props:ComplexAttrs'
      });
    });

  });


  describe('extension handling', function() {

    const extensionModel = createModel([ 'extensions' ]);


    describe('attributes', function() {

      it('should read extension attributes', async function() {

        // given
        const reader = new Reader(extensionModel);
        const rootHandler = reader.handler('e:Root');

        const xml = '<e:root xmlns:e="http://extensions" xmlns:other="http://other" other:foo="BAR" />';

        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element.$attrs).to.jsonEqual({
          'xmlns:e': 'http://extensions',
          'xmlns:other': 'http://other',
          'other:foo' : 'BAR'
        });
      });


      it('should read default ns', async function() {

        // given
        const reader = new Reader(extensionModel);
        const rootHandler = reader.handler('e:Root');

        const xml = '<root xmlns="http://extensions" />';

        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element.$attrs).to.jsonEqual({
          'xmlns': 'http://extensions'
        });
      });

    });


    describe('elements', function() {

      it('should read self-closing extension elements', async function() {

        // given
        const reader = new Reader(extensionModel);
        const rootHandler = reader.handler('e:Root');

        const xml =
          '<e:root xmlns:e="http://extensions" xmlns:other="http://other">' +
            '<e:id>FOO</e:id>' +
            '<other:meta key="FOO" value="BAR" />' +
            '<other:meta key="BAZ" value="FOOBAR" />' +
          '</e:root>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'e:Root',
          id: 'FOO',
          extensions: [
            {
              $type: 'other:meta',
              key: 'FOO',
              value: 'BAR'
            },
            {
              $type: 'other:meta',
              key: 'BAZ',
              value: 'FOOBAR'
            }
          ]
        });
      });


      it('should read extension element body', async function() {

        // given
        const reader = new Reader(extensionModel);
        const rootHandler = reader.handler('e:Root');

        const xml =
          '<e:root xmlns:e="http://extensions" xmlns:other="http://other">' +
            '<e:id>FOO</e:id>' +
            '<other:note>' +
              'a note' +
            '</other:note>' +
          '</e:root>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'e:Root',
          id: 'FOO',
          extensions: [
            {
              $type: 'other:note',
              $body: 'a note'
            }
          ]
        });
      });


      it('should read nested extension element', async function() {

        // given
        const reader = new Reader(extensionModel);
        const rootHandler = reader.handler('e:Root');

        const xml =
          '<e:root xmlns:e="http://extensions" xmlns:other="http://other">' +
            '<e:id>FOO</e:id>' +
            '<other:nestedMeta>' +
              '<other:meta key="k1" value="v1" />' +
              '<other:meta key="k2" value="v2" />' +
              '<other:additionalNote>' +
                'this is some text' +
              '</other:additionalNote>' +
            '</other:nestedMeta>' +
          '</e:root>';

        // when
        const {
          element
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(element).to.jsonEqual({
          $type: 'e:Root',
          id: 'FOO',
          extensions: [
            {
              $type: 'other:nestedMeta',
              $children: [
                { $type: 'other:meta', key: 'k1', value: 'v1' },
                { $type: 'other:meta', key: 'k2', value: 'v2' },
                { $type: 'other:additionalNote', $body: 'this is some text' }
              ]
            }
          ]
        });
      });


      describe('descriptor', function() {

        it('should exist', async function() {

          // given
          const reader = new Reader(extensionModel);
          const rootHandler = reader.handler('e:Root');

          const xml =
            '<e:root xmlns:e="http://extensions" xmlns:other="http://other">' +
              '<e:id>FOO</e:id>' +
              '<other:note>' +
                'a note' +
              '</other:note>' +
            '</e:root>';

          // when
          const {
            element
          } = await reader.fromXML(xml, rootHandler);

          const note = element.extensions[0];

          // then
          expect(note.$descriptor).to.exist;
        });


        it('should contain namespace information', async function() {

          // given
          const reader = new Reader(extensionModel);
          const rootHandler = reader.handler('e:Root');

          const xml =
            '<e:root xmlns:e="http://extensions" xmlns:other="http://other">' +
              '<e:id>FOO</e:id>' +
              '<other:note>' +
                'a note' +
              '</other:note>' +
            '</e:root>';

          // when
          const {
            element
          } = await reader.fromXML(xml, rootHandler);

          const note = element.extensions[0];

          // then
          expect(note.$descriptor).to.eql({
            name: 'other:note',
            isGeneric: true,
            ns: {
              prefix: 'other',
              localName: 'note',
              uri: 'http://other'
            }
          });
        });

      });


      describe('namespace declarations', function() {

        it('should handle nested', async function() {

          // given
          const reader = new Reader(extensionModel);
          const rootHandler = reader.handler('e:Root');

          const xml =
            '<e:root xmlns:e="http://extensions">' +
              '<bar:bar xmlns:bar="http://bar">' +
                '<other:child b="B" xmlns:other="http://other" />' +
              '</bar:bar>' +
              '<foo xmlns="http://foo">' +
                '<child a="A" />' +
              '</foo>' +
            '</e:root>';

          // when
          const {
            element
          } = await reader.fromXML(xml, rootHandler);

          // then
          expect(element).to.jsonEqual({
            $type: 'e:Root',
            extensions: [
              {
                $type: 'bar:bar',
                'xmlns:bar': 'http://bar',
                $children: [
                  {
                    $type: 'other:child',
                    'xmlns:other': 'http://other',
                    b: 'B'
                  }
                ]
              },
              {
                $type: 'ns0:foo',
                'xmlns': 'http://foo',
                $children: [
                  { $type: 'ns0:child', a: 'A' }
                ]
              }
            ]
          });
        });


        it('should handle nested, re-declaring default', async function() {

          // given
          const reader = new Reader(extensionModel);
          const rootHandler = reader.handler('e:Root');

          const xml =
            '<root xmlns="http://extensions">' +
              '<bar:bar xmlns:bar="http://bar">' +
                '<other:child b="B" xmlns:other="http://other" />' +
              '</bar:bar>' +
              '<foo xmlns="http://foo">' +
                '<child a="A" />' +
              '</foo>' +
            '</root>';

          // when
          const {
            element
          } = await reader.fromXML(xml, rootHandler);

          // then
          expect(element).to.jsonEqual({
            $type: 'e:Root',
            extensions: [
              {
                $type: 'bar:bar',
                'xmlns:bar': 'http://bar',
                $children: [
                  {
                    $type: 'other:child',
                    'xmlns:other': 'http://other',
                    b: 'B'
                  }
                ]
              },
              {
                $type: 'ns0:foo',
                'xmlns': 'http://foo',
                $children: [
                  {
                    $type: 'ns0:child',
                    a: 'A'
                  }
                ]
              }
            ]
          });
        });

      });

    });

  });


  describe('parent -> child relationship', function() {

    const model = createModel([ 'properties' ]);
    const extendedModel = createModel([ 'properties', 'properties-extended' ]);
    const extensionModel = createModel([ 'extensions' ]);


    it('should expose $parent on model elements', async function() {

      // given
      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ComplexAttrs');

      const xml = '<props:complexAttrs xmlns:props="http://properties" ' +
                                    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
                  '<props:attrs xsi:type="props:Attributes" integerValue="10" />' +
                '</props:complexAttrs>';

      // when
      const {
        element
      } = await reader.fromXML(xml, rootHandler);

      // then
      expect(element.$parent).not.to.exist;
      expect(element.attrs.$parent).to.equal(element);
    });


    it('should expose $parent on references', async function() {

      // given
      const reader = new Reader(extendedModel);
      const rootHandler = reader.handler('props:Root');

      const xml =
        '<props:root xmlns:props="http://properties">' +
          '<props:containedCollection id="C_5">' +
            '<props:complex id="C_1" />' +
            '<props:complex id="C_2" />' +
          '</props:containedCollection>' +
          '<props:referencingSingle id="C_4" referencedComplex="C_1" />' +
        '</props:root>';

      // when
      const {
        element
      } = await reader.fromXML(xml, rootHandler);

      const containedCollection = element.any[0];
      const referencedComplex = element.any[1].referencedComplex;

      // then
      expect(referencedComplex.$parent).to.equal(containedCollection);
    });


    it('should expose $parent on extension elements', async function() {

      // given
      const reader = new Reader(extensionModel);
      const rootHandler = reader.handler('e:Root');

      const xml =
        '<e:root xmlns:e="http://extensions" xmlns:other="http://other">' +
          '<e:id>FOO</e:id>' +
          '<other:nestedMeta>' +
            '<other:meta key="k1" value="v1" />' +
            '<other:meta key="k2" value="v2" />' +
            '<other:additionalNote>' +
              'this is some text' +
            '</other:additionalNote>' +
          '</other:nestedMeta>' +
        '</e:root>';

      // when
      const {
        element
      } = await reader.fromXML(xml, rootHandler);

      const child = element.extensions[0];
      const nested = child.$children[0];

      // then
      expect(child.$parent).to.equal(element);
      expect(nested.$parent).to.equal(child);

      expect(element).to.jsonEqual({
        $type: 'e:Root',
        id: 'FOO',
        extensions: [
          {
            $type: 'other:nestedMeta',
            $children: [
              { $type: 'other:meta', key: 'k1', value: 'v1' },
              { $type: 'other:meta', key: 'k2', value: 'v2' },
              { $type: 'other:additionalNote', $body: 'this is some text' }
            ]
          }
        ]
      });
    });

  });


  describe('qualified extensions', function() {

    const extensionModel = createModel([ 'extension/base', 'extension/custom' ]);
    const model = createModel([ 'properties' ]);


    it('should read typed extension property', async function() {

      // given
      const reader = new Reader(extensionModel);
      const rootHandler = reader.handler('b:Root');

      const xml =
        '<b:Root xmlns:b="http://base" xmlns:c="http://custom">' +
          '<c:CustomGeneric count="10" />' +
        '</b:Root>';

      // when
      const {
        element
      } = await reader.fromXML(xml, rootHandler);

      // then
      expect(element).to.jsonEqual({
        $type: 'b:Root',
        generic: {
          $type: 'c:CustomGeneric',
          count: 10
        }
      });

    });


    it('should read typed extension attribute', async function() {

      // given
      const reader = new Reader(extensionModel);
      const rootHandler = reader.handler('b:Root');

      const xml =
        '<b:Root xmlns:b="http://base" xmlns:c="http://custom" ' +
                'c:customAttr="666">' +
        '</b:Root>';

      // when
      const {
        element
      } = await reader.fromXML(xml, rootHandler);

      // then
      expect(element).to.jsonEqual({
        $type: 'b:Root',
        customAttr: 666
      });

    });


    it('should read generic collection', async function() {

      // given
      const reader = new Reader(extensionModel);
      const rootHandler = reader.handler('b:Root');

      const xml =
        '<b:Root xmlns:b="http://base" xmlns:c="http://custom" ' +
                'xmlns:other="http://other">' +
          '<c:Property key="foo" value="FOO" />' +
          '<c:Property key="bar" value="BAR" />' +
          '<other:Xyz>content</other:Xyz>' +
        '</b:Root>';

      // when
      const {
        element
      } = await reader.fromXML(xml, rootHandler);

      // then
      expect(element).to.jsonEqual({
        $type: 'b:Root',
        genericCollection: [
          {
            $type: 'c:Property',
            key: 'foo',
            value: 'FOO'
          },
          {
            $type: 'c:Property',
            key: 'bar',
            value: 'BAR'
          },
          {
            $type: 'other:Xyz',
            $body: 'content'
          }
        ]
      });

    });


    describe('validation', function() {

      describe('should warn on invalid well-known NS attribute', function() {

        it('extension NS', async function() {

          // given
          const reader = new Reader(extensionModel);
          const rootHandler = reader.handler('b:Root');

          const xml = `
            <b:Root xmlns:b="http://base"
                    xmlns:c="http://custom"
                    xmlns:foo="http://foo"
                    c:unknownAttribute="XXX">
            </b:Root>
          `;

          // when
          const {
            element,
            context
          } = await reader.fromXML(xml, rootHandler);

          // then
          expect(context.warnings).to.have.length(1);

          const warning = context.warnings[0];

          expect(warning.message).to.eql(
            'unknown attribute <c:unknownAttribute>'
          );

          expect(element).to.jsonEqual({
            $type: 'b:Root'
          });

          expect(element.$attrs).to.jsonEqual({
            'xmlns:b': 'http://base',
            'xmlns:c': 'http://custom',
            'xmlns:foo': 'http://foo',
            'c:unknownAttribute': 'XXX'
          });
        });


        it('local NS', async function() {

          // given
          const reader = new Reader({ model: model, lax: true });
          const rootHandler = reader.handler('props:ComplexAttrs');

          const xml = '<props:complexAttrs xmlns:props="http://properties" props:unknownAttribute="FOO" />';

          const {
            element,
            context
          } = await reader.fromXML(xml, rootHandler);

          // then
          expect(context.warnings).to.have.length(1);

          const warning = context.warnings[0];

          expect(warning.message).to.eql(
            'unknown attribute <props:unknownAttribute>'
          );

          expect(element).to.jsonEqual({
            $type: 'props:ComplexAttrs'
          });

          expect(element.$attrs).to.jsonEqual({
            'xmlns:props': 'http://properties',
            'props:unknownAttribute': 'FOO'
          });
        });

      });


      it('should permit non-well-known attributes', async function() {

        // given
        const reader = new Reader(extensionModel);
        const rootHandler = reader.handler('b:Root');

        const xml = `
          <b:Root
              xmlns:b="http://base"
              xmlns:blub="http://blub"
              blub:attr="XXX">
          </b:Root>
        `;

        // when
        const {
          element,
          context
        } = await reader.fromXML(xml, rootHandler);

        // then
        expect(context.warnings).to.be.empty;

        expect(element).to.jsonEqual({
          $type: 'b:Root'
        });

        expect(element.$attrs).to.jsonEqual({
          'xmlns:b': 'http://base',
          'xmlns:blub': 'http://blub',
          'blub:attr': 'XXX'
        });
      });


      it('should fail parsing unknown element', async function() {

        // given
        const reader = new Reader(extensionModel);
        const rootHandler = reader.handler('b:Root');

        const xml =
          '<b:Root xmlns:b="http://base" xmlns:c="http://custom" ' +
                  'xmlns:other="http://other">' +
            '<c:NonExisting />' +
          '</b:Root>';

        try {
          // when
          await reader.fromXML(xml, rootHandler);

          expectedError();
        } catch (error) {

          // then
        }
      });

    });

  });


  describe('fake ids', function() {

    const fakeIdsModel = createModel([ 'fake-id' ]);


    it('should ignore (non-id) id attribute', async function() {

      // given
      const reader = new Reader(fakeIdsModel);
      const rootHandler = reader.handler('fi:Root');

      const xml =
        '<fi:Root xmlns:fi="http://fakeid">' +
          '<fi:ChildWithFakeId id="FOO" />' +
        '</fi:Root>';

      // when
      const {
        element,
        context
      } = await reader.fromXML(xml, rootHandler);

      // then
      expect(element).to.jsonEqual({
        $type: 'fi:Root',
        children: [
          {
            $type: 'fi:ChildWithFakeId',
            id: 'FOO'
          }
        ]
      });

      expect(context.elementsById).to.be.empty;
    });


    it('should not-resolve (non-id) id references', async function() {

      // given
      const reader = new Reader(fakeIdsModel);
      const rootHandler = reader.handler('fi:Root');

      const xml =
        '<fi:Root xmlns:fi="http://fakeid">' +
          '<fi:ChildWithFakeId id="FOO" />' +
          '<fi:ChildWithFakeId ref="FOO" />' +
        '</fi:Root>';

      // when
      const {
        element,
        context
      } = await reader.fromXML(xml, rootHandler);

      // then
      expect(element).to.jsonEqual({
        $type: 'fi:Root',
        children: [
          {
            $type: 'fi:ChildWithFakeId',
            id: 'FOO'
          },
          {
            $type: 'fi:ChildWithFakeId'
          }
        ]
      });

      expect(context.warnings).to.have.length(1);
      expect(context.warnings[0].message).to.eql('unresolved reference <FOO>');
    });

  });


  describe('encoding', function() {

    const model = createModel([ 'properties' ]);

    it('should decode UTF-8, no problemo', async function() {

      // given
      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ComplexAttrs');

      const xml =
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<props:complexAttrs xmlns:props="http://properties">' +
        '</props:complexAttrs>';

      // when
      const {
        element,
        context
      } = await reader.fromXML(xml, rootHandler);

      // then
      expect(context.warnings).to.be.empty;

      expect(element).to.exist;
      expect(context).to.exist;
    });


    it('should warn on non-UTF-8 encoded files', async function() {

      // given
      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ComplexAttrs');

      const xml =
        '<?xml encoding="windows-1252"?>' +
        '<props:complexAttrs xmlns:props="http://properties">' +
        '</props:complexAttrs>';

      // when
      const {
        context,
        element
      } = await reader.fromXML(xml, rootHandler);

      // then
      expect(element).to.exist;

      expect(context.warnings).to.have.length(1);
      expect(context.warnings[0].message).to.match(
        /unsupported document encoding <windows-1252>/
      );
    });


    it('should warn on non-UTF-8 encoded files / CAPITALIZED', async function() {

      // given
      const reader = new Reader(model);
      const rootHandler = reader.handler('props:ComplexAttrs');

      const xml =
        '<?XML ENCODING="WINDOWS-1252"?>' +
        '<props:complexAttrs xmlns:props="http://properties">' +
        '</props:complexAttrs>';

      // when
      const {
        element,
        context
      } = await reader.fromXML(xml, rootHandler);

      // then
      expect(element).to.exist;

      expect(context.warnings).to.have.length(1);
      expect(context.warnings[0].message).to.match(
        /unsupported document encoding <WINDOWS-1252>/
      );
    });

  });


  describe('attr <> child conflict', function() {

    const model = createModel([ 'attr-child-conflict' ]);


    it('should import attr and child with the same name', async function() {

      // given
      const reader = new Reader(model);
      const rootHandler = reader.handler('s:Foo');

      const xml = `
        <s:foo xmlns:s="http://s" bar="Bar">
          <s:bar woop="WHOOPS">
          </s:bar>
        </s:foo>`;

      // when
      const {
        element
      } = await reader.fromXML(xml, rootHandler);

      // then
      expect(element).to.jsonEqual({
        $type: 's:Foo',
        bar: 'Bar',
        bars: [
          {
            $type: 's:Bar',
            woop: 'WHOOPS'
          }
        ]
      });

    });

  });

});


// helpers //////////////

function expectedError() {
  return expect.fail('expected error');
}
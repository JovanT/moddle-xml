import expect from '../expect';

import {
  assign
} from 'min-dash';

import {
  Reader,
  Writer
} from '../../lib';

import {
  createModelBuilder
} from '../helper';


describe('Roundtrip', function() {

  var createModel = createModelBuilder('test/fixtures/model/');

  function setup(packages) {

    var model = createModel(packages);

    return {
      model,
      reader: new Reader(model),
      writer: new Writer({ preamble: false })
    };
  }


  it('should strip unused global', async function() {

    // given
    var {
      model,
      reader,
      writer
    } = setup([ 'properties', 'properties-extended' ]);

    var rootHandler = reader.handler('ext:Root');

    var input =
      '<root xmlns="http://extended" xmlns:props="http://properties" id="Root">' +
        '<props:Base xmlns="http://properties" />' +
      '</root>';

    // when
    var {
      rootElement
    } = await reader.fromXML(input, rootHandler);

    var output = writer.toXML(rootElement);

    // then
    expect(output).to.eql(
      '<root xmlns="http://extended" id="Root">' +
        '<base xmlns="http://properties" />' +
      '</root>'
    );
  });


  it('should reuse global namespace', async function() {

    // given
    var {
      model,
      reader,
      writer
    } = setup([ 'properties', 'properties-extended' ]);

    var rootHandler = reader.handler('props:ComplexNesting');

    var input =
      '<root:complexNesting xmlns:root="http://properties" xmlns:ext="http://extended">' +
        '<complexNesting xmlns="http://properties">' +
          '<ext:extendedComplex numCount="1" />' +
        '</complexNesting>' +
      '</root:complexNesting>';

    // when
    var {
      rootElement
    } = await reader.fromXML(input, rootHandler);

    var output = writer.toXML(rootElement);

    expect(output).to.eql(
      '<root:complexNesting xmlns:root="http://properties" xmlns:ext="http://extended">' +
        '<complexNesting xmlns="http://properties">' +
          '<ext:extendedComplex numCount="1" />' +
        '</complexNesting>' +
      '</root:complexNesting>'
    );
  });


  it('should serialize xml:... attributes', async function() {

    // given
    var {
      model,
      reader,
      writer
    } = setup([ 'properties' ]);

    var rootHandler = reader.handler('props:Root');

    var input = '<root xmlns="http://properties" xml:lang="en" />';

    // when
    var {
      rootElement
    } = await reader.fromXML(input, rootHandler);

    var output = writer.toXML(rootElement);

    // then
    expect(output).to.eql(input);
  });

});

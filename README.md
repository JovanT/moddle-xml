# moddle-xml

[![Build Status](https://travis-ci.org/bpmn-io/moddle-xml.svg?branch=master)](https://travis-ci.org/bpmn-io/moddle-xml)

Read and write XML documents described with [moddle](https://github.com/bpmn-io/moddle).


## Usage

Get the libray via [npm](http://npmjs.org)

```
npm install --save moddle-xml
```


#### Bootstrap

Create a [moddle instance](https://github.com/bpmn-io/moddle)

```javascript
import Moddle from 'moddle';
import {
  Reader,
  Writer
} from 'moddle-xml';

const model = new Moddle([ myPackage ]);
```


#### Read XML

Use the reader to parse XML into an object tree:

```javascript
const xml =
  '<my:root xmlns:props="http://mypackage">' +
    '<my:car id="Car_1">' +
      '<my:engine power="121" fuelConsumption="10" />' +
    '</my:car>' +
  '</my:root>';

const reader = new Reader(model);
const rootHandler = reader.handler('my:Root');

try {
  const {
    element: cars,
    context
  } = await reader.fromXML(xml, rootHandler);

  console.log(cars);
  // {
  //  $type: 'my:Root',
  //  cars: [
  //    {
  //      $type: 'my:Car',
  //      id: 'Car_1',
  //      engine: [
  //        { $type: 'my:Engine', powser: 121, fuelConsumption: 10 }
  //      ]
  //    }
  //  ]
  // }

  // parse context expose warnings and other details
  if (context.warnings.length) {
    console.log('import warnings', context.warnings);
  }
} catch (err) {

  console.error('import error', err);

  // parse context exposes additional details
  console.log(err.context);
}
```


#### Write XML

Use the writer to serialize the object tree back to XML:

```javascript
const cars = model.create('my:Root');
cars.get('cars').push(model.create('my:Car', { power: 10 }));

const options = { format: false, preamble: false };
const writer = new Writer(options);

const xml = writer.toXML(bar);

console.log(xml); // <my:root xmlns:props="http://mypackage"> ... <my:car power="10" /></my:root>
```


## License

MIT

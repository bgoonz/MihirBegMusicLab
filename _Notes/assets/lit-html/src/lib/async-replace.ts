/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import { directive, DirectiveFn, NodePart } from "../lit-html.js";

/**
 * A directive that renders the items of an async iterable[1], replacing
 * previous values with new values, so that only one value is ever rendered
 * at a time.
 *
 * Async iterables are objects with a [Symbol.asyncIterator] method, which
 * returns an iterator who's `next()` method returns a Promise. When a new
 * value is available, the Promise resolves and the value is rendered to the
 * Part controlled by the directive. If another value other than this
 * directive has been set on the Part, the iterable will no longer be listened
 * to and new values won't be written to the Part.
 *
 * [1]: https://github.com/tc39/proposal-async-iteration
 *
 * @param value An async iterable
 * @param mapper An optional function that maps from (value, index) to another
 *     value. Useful for generating templates for each item in the iterable.
 */
export const asyncReplace = <T>(
  value: AsyncIterable<T>,
  mapper?: (v: T, index?: number) => any
): DirectiveFn<NodePart> =>
  directive(async (part: NodePart) => {
    // If we've already set up this particular iterable, we don't need
    // to do anything.
    if (value === part._previousValue) {
      return;
    }

    // We nest a new part to keep track of previous item values separately
    // of the iterable as a value itself.
    const itemPart = new NodePart(part.instance, part.startNode, part.endNode);

    part._previousValue = itemPart;

    let i = 0;

    for await (let v of value) {
      // When we get the first value, clear the part. This let's the
      // previous value display until we can replace it.
      if (i === 0) {
        part.clear();
      }

      // Check to make sure that value is the still the current value of
      // the part, and if not bail because a new value owns this part
      if (part._previousValue !== itemPart) {
        break;
      }

      // As a convenience, because functional-programming-style
      // transforms of iterables and async iterables requires a library,
      // we accept a mapper function. This is especially convenient for
      // rendering a template for each item.
      if (mapper !== undefined) {
        v = mapper(v, i);
      }

      itemPart.setValue(v);
      i++;
    }
  });

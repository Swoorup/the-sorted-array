# Sorted Array Manipulation Library

This TypeScript library provides utilities for working with sorted arrays. Here's a brief overview of the features:

1. **Range**: Defines a range with start and end values.
2. **InsertionType**: Enumerates insertion types, whether updating at an index or inserting after an index.
3. **InsertionPoint**: Defines where and how to perform an insertion in the array.
4. **findInsertionPoint**: Finds where an element should be inserted or updated in a sorted array.
5. **findInsertionPointReversed**: Same as `findInsertionPoint` but for arrays sorted in reverse order.
6. **searchRange**: Finds the range of indices for insertion or update in a sorted array.
7. **splitByRange**: Splits an array into three parts based on a specified range: non-overlapping left, overlapping, and non-overlapping right blocks.
8. **merge**: Merges two sorted arrays into a new sorted array, resolving duplicates and optionally filtering results.
9. **mergeInPlace**: Merges two sorted arrays into one, modifying the first array in-place.
10. **extractRange**: Extracts the range of the array based on a key selector function.

Each function is designed with flexibility in mind, allowing you to pass in custom comparison or key selector functions to accommodate different types of data and sorting requirements.

## Installation
To install it in your project, use the following command with [yarn](https://yarnpkg.com/):

```bash
yarn add @sytherax/the-sorted-array
```

Please refer to the source code for more detailed usage instructions and examples.

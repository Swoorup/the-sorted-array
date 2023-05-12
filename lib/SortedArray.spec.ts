import { describe, expect, it } from 'vitest';
import {
  splitByRange,
  findInsertPoint,
  searchRange,
  InsertType,
  merge,
  findInsertPointReversed,
  mergeInPlace,
  trimByWindow,
  mergeInPlaceGaplessChunk
} from './SortedArray';
import * as NEA from 'fp-ts/NonEmptyArray';
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/lib/function';

const id = <T>(it: T) => it;

describe('Find Insertion or Update range on Sorted Arrays.', () => {
  const arr = NEA.range(0, 99).filter((x) => x <= 40 || x >= 60);

  it('All before the start and non-overlapping', () => {
    const search = { from: -1, to: -1 };
    expect(searchRange(arr, id, search)).toEqual({ from: undefined, to: undefined });
    expect(splitByRange(arr, id, search)).toEqual([[], [], arr]);
  });

  it('From before the start and to intersecting into starting element', () => {
    const search = { from: -1, to: 0 };
    expect(searchRange(arr, id, search)).toEqual({
      from: undefined,
      to: [ InsertType.UpdateAt, 0 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([[], [0], arr.slice(1)]);
  });

  it('From before the start and to intersecting into a gap', () => {
    const search = { from: -1, to: 41 };
    expect(searchRange(arr, id, search)).toEqual({
      from: undefined,
      to: [ InsertType.InsertAfter, 40 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([[], NEA.range(0, 40), NEA.range(60, 99)]);
  });

  it('From before the start and to intersecting after a gap', () => {
    const search = { from: -1, to: 60 };
    expect(searchRange(arr, id, search)).toEqual({
      from: undefined,
      to: [ InsertType.UpdateAt, 41 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([
      [],
      [NEA.range(0, 40), [60]].flat(),
      NEA.range(61, 99)
    ]);
  });

  it('Covers the entire data but ends at the last element', () => {
    const search = { from: -1, to: 99 };
    expect(searchRange(arr, id, search)).toEqual({
      from: undefined,
      to: [ InsertType.UpdateAt, 80 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([[], arr, []]);
  });

  it('Covers the entire data outside both bounds', () => {
    const search = { from: -1, to: 100 };
    console.log(arr.length);
    expect(searchRange(arr, id, search)).toEqual({
      from: undefined,
      to: [ InsertType.InsertAfter, 80 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([[], arr, []]);
  });

  it('From exactly at start to start', () => {
    const search = { from: 0, to: 0 };
    expect(searchRange(arr, id, search)).toEqual({
      from: [ InsertType.UpdateAt, 0 ],
      to: [ InsertType.UpdateAt, 0 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([[], [0], A.dropLeft(1)(arr)]);
  });

  it('From exactly at start to next element', () => {
    const search = { from: 0, to: 1 };
    expect(searchRange(arr, id, search)).toEqual({
      from: [ InsertType.UpdateAt, 0 ],
      to: [ InsertType.UpdateAt, 1 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([[], [0, 1], A.dropLeft(2)(arr)]);
  });

  it('From exactly at start to a gap', () => {
    const search = { from: 0, to: 44 };
    expect(searchRange(arr, id, search)).toEqual({
      from: [ InsertType.UpdateAt, 0 ],
      to: [ InsertType.InsertAfter, 40 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([[], NEA.range(0, 40), NEA.range(60, 99)]);
  });

  it('From exactly at start to element after a gap', () => {
    const search = { from: 0, to: 60 };
    expect(searchRange(arr, id, search)).toEqual({
      from: [ InsertType.UpdateAt, 0 ],
      to: [ InsertType.UpdateAt, 41 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([
      [],
      [NEA.range(0, 40), [60]].flat(),
      NEA.range(61, 99)
    ]);
  });

  it('From exactly at start to exactly at end', () => {
    const search = { from: 0, to: 99 };
    expect(searchRange(arr, id, search)).toEqual({
      from: [ InsertType.UpdateAt, 0 ],
      to: [ InsertType.UpdateAt, 80 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([[], arr, []]);
  });

  it('From exactly at start to after the end', () => {
    const search = { from: 0, to: 100 };
    expect(searchRange(arr, id, search)).toEqual({
      from: [ InsertType.UpdateAt, 0 ],
      to: [ InsertType.InsertAfter, 80 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([[], arr, []]);
  });

  it('From a gap to the same gap', () => {
    const search = { from: 44, to: 44 };
    expect(searchRange(arr, id, search)).toEqual({
      from: [ InsertType.InsertAfter, 40 ],
      to: [ InsertType.InsertAfter, 40 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([NEA.range(0, 40), [], NEA.range(60, 99)]);
  });

  it('From a gap to the same gap but other element', () => {
    const search = { from: 44, to: 45 };
    expect(searchRange(arr, id, search)).toEqual({
      from: [ InsertType.InsertAfter, 40 ],
      to: [ InsertType.InsertAfter, 40 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([NEA.range(0, 40), [], NEA.range(60, 99)]);
  });

  it('From a gap to the exactly at end', () => {
    const search = { from: 44, to: 99 };
    expect(searchRange(arr, id, search)).toEqual({
      from: [ InsertType.InsertAfter, 40 ],
      to: [ InsertType.UpdateAt, 80 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([NEA.range(0, 40), NEA.range(60, 99), []]);
  });

  it('From a gap to the over the end', () => {
    const search = { from: 44, to: 100 };
    expect(searchRange(arr, id, search)).toEqual({
      from: [ InsertType.InsertAfter, 40 ],
      to: [ InsertType.InsertAfter, 80 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([NEA.range(0, 40), NEA.range(60, 99), []]);
  });

  it('Exactly all at end', () => {
    const search = { from: 99, to: 99 };
    expect(searchRange(arr, id, search)).toEqual({
      from: [ InsertType.UpdateAt, 80 ],
      to: [ InsertType.UpdateAt, 80 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([A.dropRight(1)(arr), [99], []]);
  });

  it('All after the end', () => {
    const search = { from: 100, to: 100 };
    expect(searchRange(arr, id, search)).toEqual({
      from: [ InsertType.InsertAfter, 80 ],
      to: [ InsertType.InsertAfter, 80 ]
    });
    expect(splitByRange(arr, id, search)).toEqual([arr, [], []]);
  });
});

describe('mergeInPlace tests', () => {
  const compareBy = (item: number) => item;
  const duplicateResolver = (l: number) => l;
  const filterResultFn = (value: number) => value % 2 === 0;
  it("merges two sorted arrays in place", () => {
    const left = [1, 2, 3, 5, 6, 7];
    const right = [4, 8, 9, 10];
    mergeInPlace(left, right, compareBy, duplicateResolver);
    expect(left).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("filters the result using the filter function", () => {
    const left = [1, 2, 3, 5, 6, 7];
    const right = [4, 8, 9, 10];
    mergeInPlace(left, right, compareBy, duplicateResolver, 'asc', filterResultFn);
    expect(left).toEqual([2, 4, 6, 8, 10]);
  });

  it("reverses the sort order if isReversed is true", () => {
    const left = [7, 6, 5, 3, 2, 1];
    const right = [10, 9, 8, 4];
    mergeInPlace(left, right, compareBy, duplicateResolver, 'desc');
    expect(left).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it("does not modify the right array", () => {
    const left = [1, 2, 3, 5, 6, 7];
    const right = [4, 8, 9, 10];
    mergeInPlace(left, right, compareBy, duplicateResolver);
    expect(right).toEqual([4, 8, 9, 10]);
  });

  it("handles duplicate elements using the duplicateResolver function", () => {
    const left = [1, 2, 3, 5, 6, 7];
    const right = [4, 5, 8, 9, 10];
    mergeInPlace(left, right, compareBy, duplicateResolver);
    expect(left).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("returns an empty array if both input arrays are empty", () => {
    const left: number[] = [];
    const right: number[] = [];
    mergeInPlace(left, right, compareBy, duplicateResolver);
    expect(left).toEqual([]);
  });

  it("returns the left array if the right array is empty", () => {
    const left = [1, 2, 3, 5, 6, 7];
    const right: number[] = [];
    mergeInPlace(left, right, compareBy, duplicateResolver);
    expect(left).toEqual([1, 2, 3, 5, 6, 7]);
  });

  it("returns the right array if the left array is empty", () => {
    const left: number[] = [];
    const right = [4, 8, 9, 10]
    mergeInPlace(left, right, compareBy, duplicateResolver);
    expect(left).toEqual([4, 8, 9, 10]);
  });
});

describe('Find Insertion or Update Index Point on Sorted Arrays.', () => {
  const arr = [1, 2, 5];

  it('Is before the array but non-existent ', () => {
    const result = findInsertPoint(arr, id, -1);
    expect(result).toEqual(undefined);
  });

  it('Is at the start of the array', () => {
    const result = findInsertPoint(arr, id, 1);
    expect(result).toEqual([ InsertType.UpdateAt, 0 ]);
  });

  it('Is in middle of the array', () => {
    const result = findInsertPoint(arr, id, 2);
    expect(result).toEqual([ InsertType.UpdateAt, 1 ]);
  });

  it('Is in middle of the array but non-existant', () => {
    const result = findInsertPoint(arr, id, 3);
    expect(result).toEqual([ InsertType.InsertAfter, 1 ]);
  });

  it('Is in exactly after a gap', () => {
    const arr = NEA.range(0, 99).filter((x) => x <= 40 || x >= 60);
    const result = findInsertPoint(arr, id, 60);
    expect(result).toEqual([ InsertType.UpdateAt, 41 ]);
  });

  it('Is in exactly after a gap, reversed', () => {
    const arr = pipe(NEA.range(0, 99), A.filter((x) => x <= 40 || x >= 60), A.reverse);
    const result = findInsertPointReversed(arr, id, 39);
    expect(result).toEqual([ InsertType.UpdateAt, 41 ]);
  });

  it('Is in middle of the array but non-existant with filtered search', () => {
    const arr = NEA.range(0, 79).filter((x) => x <= 40 || x >= 60);
    const result = findInsertPoint(arr, id, 44, 40);
    expect(result).toEqual([ InsertType.InsertAfter, 40 ]);
  });

  it('Is in end of the array', () => {
    const result = findInsertPoint(arr, id, 5);
    expect(result).toEqual([ InsertType.UpdateAt, 2 ]);
  });

  it('After the end of the array', () => {
    const result = findInsertPoint(arr, id, 6);
    expect(result).toEqual([ InsertType.InsertAfter, 2 ]);
  });
});

describe('Merge sorted arrays test', () => {
  const a1 = [1, 2, 5];

  it('Can merge sorted arrays containing no duplicates and of equal length', () => {
    const result = merge(a1, [3, 4, 6], { selectKeyFn: id, resolveDuplicatesFn: duplicates => duplicates[0] })
    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('Can merge sorted arrays containing no duplicates and of unequal length', () => {
    const result1 = merge(a1, [3, 4, 6, 100], { selectKeyFn: id, resolveDuplicatesFn: duplicates => duplicates[0] })
    expect(result1).toEqual([1, 2, 3, 4, 5, 6, 100]);

    const result2 = merge([3, 4, 6, 100], a1, { selectKeyFn: id, resolveDuplicatesFn: duplicates => duplicates[0] })
    expect(result2).toEqual([1, 2, 3, 4, 5, 6, 100]);
  });

  it('Can merge sorted arrays containing duplicates and of equal length', () => {
    const result = merge(a1, [0, 2, 6], { selectKeyFn: id, resolveDuplicatesFn: duplicates => duplicates[0] })
    expect(result).toEqual([0, 1, 2, 5, 6]);
  });

  it('Can merge sorted arrays containing duplicates and of unequal length', () => {
    const result1 = merge(a1, [0, 2, 6, 10], { selectKeyFn: id, resolveDuplicatesFn: duplicates => duplicates[0] })
    expect(result1).toEqual([0, 1, 2, 5, 6, 10]);

    const result2 = merge([0, 2, 6, 10], a1, { selectKeyFn: id, resolveDuplicatesFn: duplicates => duplicates[0] })
    expect(result2).toEqual([0, 1, 2, 5, 6, 10]);
  });

  it('Can merge reverse sorted arrays containing duplicates and of unequal length', () => {
    const r1 = [...a1].reverse()
    const result1 = merge(r1, [0, 2, 6, 10].reverse(), { selectKeyFn: id, resolveDuplicatesFn: duplicates => duplicates[0], isReversed: true })
    expect(result1).toEqual([10, 6, 5, 2, 1, 0]);

    const result2 = merge([0, 2, 6, 10].reverse(), r1, { selectKeyFn: id, resolveDuplicatesFn: duplicates => duplicates[0], isReversed: true })
    expect(result2).toEqual([10, 6, 5, 2, 1, 0]);
  });

  it('Can merge arrays and remove duplicate', () => {
    const result1 = merge(a1, [0, 2, 6, 10], { selectKeyFn: id, resolveDuplicatesFn: () => null });
    expect(result1).toEqual([0, 1, 5, 6, 10]);
  });

  it('Can merge arrays and filter at the same time', () => {
    const result1 = merge(a1, [0, 2, 6, 10], {
      selectKeyFn: id, resolveDuplicatesFn: (duplicates) => duplicates[0], filterResultFn: (v) => v < 6
    });
    expect(result1).toEqual([0, 1, 2, 5]);
  });

});

describe('mergeInPlaceGapless', () => {
  it('can merge in leftmost where none of chunk intersect', () => {
    const data = [1, 2, 3, 4];
    const chunk = [-1, 0];
    const gaps = mergeInPlaceGaplessChunk(data, chunk, (x) => x);
    expect(data).toEqual([-1, 0, 1, 2, 3, 4]);
    expect(gaps).toEqual([{ from: 0, to: 1 }]);
  });

  it('can merge in leftmost where last of chunk intersect', () => {
    const data = [1, 2, 3, 4];
    const chunk = [0, 1];
    const gaps = mergeInPlaceGaplessChunk(data, chunk, (x) => x);
    expect(data).toEqual([0, 1, 2, 3, 4]);
    expect(gaps).toEqual([]);
  });

  it('can merge in leftmost where middle of chunk intersect', () => {
    const data = [1, 2, 3, 4];
    const chunk = [0, 1, 1.5];
    const gaps = mergeInPlaceGaplessChunk(data, chunk, (x) => x);
    expect(data).toEqual([0, 1, 1.5, 2, 3, 4]);
    expect(gaps).toEqual([{ from: 1.5, to: 2 }]);
  });

  it('can merge in leftmost where head of chunk intersects with start', () => {
    const data = [1, 2, 3, 4];
    const chunk = [1, 1.5];
    const gaps = mergeInPlaceGaplessChunk(data, chunk, (x) => x);
    expect(data).toEqual([1, 1.5, 2, 3, 4]);
    expect(gaps).toEqual([{ from: 1.5, to: 2 }]);
  });

  it('can merge in middle where the head chunk intersect', () => {
    const data = [1, 2, 4, 5, 6];
    const chunk = [2, 2.5, 3];
    const gaps = mergeInPlaceGaplessChunk(data, chunk, (x) => x);
    expect(data).toEqual([1, 2, 2.5, 3, 4, 5, 6]);
    expect(gaps).toEqual([{ from: 3, to: 4 }]);
  });

  it('can merge in middle where the last element of chunk intersect', () => {
    const data = [1, 2, 4, 5, 6];
    const chunk = [3, 4];
    const gaps = mergeInPlaceGaplessChunk(data, chunk, (x) => x);
    expect(data).toEqual([1, 2, 3, 4, 5, 6]);
    expect(gaps).toEqual([{ from: 2, to: 3 }]);
  });

  it('can merge in middle none of chunk intersects', () => {
    const data = [1, 2, 5, 6];
    const chunk = [3, 4];
    const gaps = mergeInPlaceGaplessChunk(data, chunk, (x) => x);
    expect(data).toEqual([1, 2, 3, 4, 5, 6]);
    expect(gaps).toEqual([{ from: 2, to: 3 }, { from: 4, to: 5 }]);
  });

  it('can merge in middle where chunk overlaps but not intersects', () => {
    const data = [1, 2, 5, 6];
    const chunk = [1.5, 2, 3, 4, 5, 5.5];
    const gaps = mergeInPlaceGaplessChunk(data, chunk, (x) => x);
    expect(data).toEqual([1, 1.5, 2, 3, 4, 5, 5.5, 6]);
    expect(gaps).toEqual([{ from: 1, to: 1.5 }, { from: 5.5, to: 6 }]);
  });

  it('can merge in rightmost where middle of chunk intersects', () => {
    const data = [1, 2, 5, 6];
    const chunk = [5, 6, 7];
    const gaps = mergeInPlaceGaplessChunk(data, chunk, (x) => x);
    expect(data).toEqual([1, 2, 5, 6, 7]);
    expect(gaps).toEqual([]);
  });

  it('can merge in rightmost where last of chunk intersects', () => {
    const data = [1, 2, 5, 6];
    const chunk = [6, 7];
    const gaps = mergeInPlaceGaplessChunk(data, chunk, (x) => x);
    expect(data).toEqual([1, 2, 5, 6, 7]);
    expect(gaps).toEqual([]);
  });

  it('can merge in rightmost where none of chunk intersects', () => {
    const data = [1, 2, 5, 6];
    const chunk = [7, 8];
    const gaps = mergeInPlaceGaplessChunk(data, chunk, (x) => x);
    expect(data).toEqual([1, 2, 5, 6, 7, 8]);
    expect(gaps).toEqual([{ from: 6, to: 7 }]);
  });

  it('can merge to empty array', () => {
    const data = [] as number[];
    const chunk = [7, 8];
    const gaps = mergeInPlaceGaplessChunk(data, chunk, (x) => x);
    expect(data).toEqual([7, 8]);
    expect(gaps).toEqual([]);
  });
});


describe('trimByWindow', () => {
  it('should trim the data array to the selected window', () => {
    const data = [10, 20, 30, 40, 50,];
    const window = { from: 25, to: 45 };
    trimByWindow(data, window, (x) => x);
    expect(data).toEqual([30, 40,]);
  });

  it('should empty the data array if the window is outside of the data range', () => {
    const data = [10, 20, 30, 40, 50,];
    const window = { from: 55, to: 65 };
    trimByWindow(data, window, (x) => x);
    expect(data).toEqual([]);
  });

  it('should leave the data array unchanged if the window is equal to the data range', () => {
    const data = [10, 20, 30, 40, 50,];
    const window = { from: 10, to: 50 };
    trimByWindow(data, window, (x) => x);
    expect(data).toEqual([10, 20, 30, 40, 50,]);
  });

  it('should return the data array if it is empty', () => {
    const data: { value: number }[] = [];
    const window = { from: 10, to: 50 };
    trimByWindow(data, window, (x) => x.value);
    expect(data).toEqual([]);
  });
});

import { pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import type * as NEA from "fp-ts/NonEmptyArray";
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray";

export interface Range<T> {
  /**
   * The from value. The start of the range.
   */
  from: T;
  /**
   * The to value. The end of the range.
   */
  to: T;
}

export enum InsertType {
  UpdateAt = 0,
  InsertAfter
}

export type InsertPoint = [type: InsertType, index: number]

/**
 * Find insertion or update index using binary search
 * @param source the sorted array to scan
 * @param select selector of C for comparison
 * @param target target element to scan to be inserted
 * @param fromIndex scan from range index
 * @param toIndex scan to range index
 * @returns index to update at or insert after
 */
export function findInsertPoint<Item, Key extends number>(
  source: ReadonlyArray<Item>,
  select: (e: Item) => Key,
  target: Key,
  fromIndex?: number,
  toIndex?: number
): InsertPoint | undefined {
  if (source.length == 0) return [InsertType.UpdateAt, 0];

  let [leftIndex, rightIndex] = [fromIndex ?? 0, toIndex ?? source.length - 1];
  const [initialLeft, initialRight] = [select(source[leftIndex]), select(source[rightIndex])];

  if (target == initialLeft) return [InsertType.UpdateAt, leftIndex];
  else if (target < initialLeft) return undefined;
  else if (target == initialRight) return [InsertType.UpdateAt, rightIndex];
  else if (target > initialRight) return [InsertType.InsertAfter, rightIndex];

  while (leftIndex < rightIndex) {
    const midIdx = Math.floor((leftIndex + rightIndex) / 2);
    const mid = select(source[midIdx]);

    if (mid === target) return [InsertType.UpdateAt, midIdx];
    if (target < mid) rightIndex = midIdx - 1;
    else leftIndex = midIdx + 1;
  }

  const lastSearched = select(source[leftIndex]);
  if (target == lastSearched) return [InsertType.UpdateAt, rightIndex];
  else if (target < lastSearched) return [InsertType.InsertAfter, leftIndex - 1];
  else return [InsertType.InsertAfter, leftIndex];
}

/**
 * Find insertion or update index using binary search
 * @param source the sorted array to scan
 * @param select selector of C for comparison
 * @param target target element to scan to be inserted
 * @param fromIdx scan from range index
 * @param toIdx scan to range index
 * @returns index to update at or insert after
 */
export function findInsertPointReversed<Item, Key extends number>(
  source: ReadonlyArray<Item>,
  select: (item: Item) => Key,
  target: Key,
  fromIdx?: number,
  toIdx?: number
): InsertPoint | undefined {
  if (source.length == 0) return [InsertType.UpdateAt, 0];

  let [leftIdx, rightIdx] = [fromIdx ?? 0, toIdx ?? source.length - 1];
  const [initialLeft, initialRight] = [select(source[leftIdx]), select(source[rightIdx])];

  if (target == initialLeft) return [InsertType.UpdateAt, leftIdx];
  else if (target > initialLeft) return undefined;
  else if (target == initialRight) return [InsertType.UpdateAt, rightIdx];
  else if (target < initialRight) return [InsertType.InsertAfter, rightIdx];

  while (leftIdx < rightIdx) {
    const midIdx = Math.floor((leftIdx + rightIdx) / 2);
    const mid = select(source[midIdx]);

    if (mid === target) return [InsertType.UpdateAt, midIdx];
    if (target > mid) rightIdx = midIdx - 1;
    else leftIdx = midIdx + 1;
  }

  const lastSearched = select(source[leftIdx]);
  if (target == lastSearched) return [InsertType.UpdateAt, rightIdx];
  else if (target > lastSearched) return [InsertType.InsertAfter, leftIdx - 1];
  else return [InsertType.InsertAfter, leftIdx];
}

/**
 * Find Insertion or update range for the given search range
 * @param target the array to read
 * @param selectKeyFn selector of the element to compare
 * @param range range to find
 * @returns
 */
export function searchRange<Item, Key extends number>(
  target: Item[],
  selectKeyFn: (element: Item) => Key,
  range: Range<Key>
): Range<InsertPoint | undefined> {
  const from = findInsertPoint(target, selectKeyFn, range.from);

  const to = pipe(
    from,
    O.fromNullable,
    O.match(
      () => findInsertPoint(target, selectKeyFn, range.to),
      ([, vIndex]) => findInsertPoint(target, selectKeyFn, range.to, vIndex, target.length - 1)
    )
  );

  return { from, to };
}

export type SpliceResult = {
  start: number,
  count: number,
  leftGapFromIndex?: number,
  rightGapToIndex?: number
}

export function getSpliceIndex<Item, Key extends number>(
  target: Item[],
  selectKeyFn: (element: Item) => Key,
  range: Range<Key>
): SpliceResult {
  const { from, to } = searchRange(target, selectKeyFn, range);

  let startIndex: number;
  let count = 0;
  let leftGapFromIndex: number | undefined;
  let rightGapToIndex: number | undefined;

  if (from) {
    const [fromKind, fromIndex] = from;
    if (fromKind == InsertType.InsertAfter) {
      startIndex = fromIndex + 1;
      leftGapFromIndex = fromIndex;
    } else {
      startIndex = fromIndex;
    }
  } else {
    startIndex = 0;
  }

  if (to) {
    const [toKind, toIndex] = to;
    count += toIndex - startIndex;
    if (toIndex >= startIndex) count += 1;
    if (toKind == InsertType.InsertAfter) {
      if (toIndex + 1 < target.length) {
        rightGapToIndex = toIndex + 1;
      }
    }
  } else {
    rightGapToIndex = 0;
  }

  return {
    start: startIndex,
    count,
    leftGapFromIndex,
    rightGapToIndex
  };
}

/**
 * Splits an array into three parts: the non-overlapping left block, the overlapping block, and the non-overlapping right block,
 * according to a specified range.
 *
 * @param {Item[]} source - The array to be split.
 * @param {function(Item): Key} selectKeyFn - A function that takes an item from the `source` array and returns a key. This key is used to determine where each item falls in relation to the `range`.
 * @param {Range<Key>} range - An object with `start` and `end` properties that specify the range used for splitting the array.
 *
 * @returns {[Item[], Item[], Item[]]} A tuple of three arrays:
 * 1. `left`: All items from the `source` that fall before the specified `range`.
 * 2. `overlaps`: All items from the `source` that fall within the specified `range`.
 * 3. `right`: All items from the `source` that fall after the specified `range`.
 */
export function splitByRange<Item, Key extends number>(
  source: Item[],
  selectKeyFn: (element: Item) => Key,
  range: Range<Key>
): [Item[], Item[], Item[]] {
  const { from, to } = searchRange(source, selectKeyFn, range);

  const [left, fromOverlapIdx] = pipe(
    from,
    O.fromNullable,
    O.match<InsertPoint, [Item[], number | undefined]>(
      () => [[], undefined],
      ([kind, index]) => {
        if (kind == InsertType.InsertAfter) return [source.slice(0, index + 1), index + 1];
        else return [source.slice(0, index), index];
      }
    )
  );

  const [right, toOverlapIdx] = pipe(
    to,
    O.fromNullable,
    O.match<InsertPoint, [Item[], number | undefined]>(
      () => [source, undefined],
      ([, index]) => {
        return [source.slice(index + 1), index + 1];
      }
    )
  );

  const overlaps = fromOverlapIdx || toOverlapIdx ? source.slice(fromOverlapIdx, toOverlapIdx) : [];
  return [left, overlaps, right];
}

type MergeOptions<Item, Key extends number> = {
  selectKeyFn: (item: Item) => Key,
  resolveDuplicatesFn: (duplicates: NEA.NonEmptyArray<Item>) => Item | null,
  isReversed?: boolean,
  filterResultFn?: (value: Item) => boolean
}

/**
 * Merge 2 sorted arrays into a new array
 * @param left The first array
 * @param right The second array
 * @param compareBy the compare element selector
 * @param resolveDuplicatesFn the function that resolves the duplicate
 * @param isReversed describes the order of sort
 * @param filterResultFn an optional function that takes an item and returns a boolean indicating whether to include in the merged array
 */
export function merge<Item, Key extends number>(
  left: ReadonlyArray<Item>,
  right: ReadonlyArray<Item>,
  options: MergeOptions<Item, Key>
): ReadonlyArray<Item> {
  const {
    selectKeyFn,
    resolveDuplicatesFn,
    isReversed = false,
    filterResultFn = () => true
  } = options;

  if (left.length == 0) return right;
  if (right.length == 0) return left;

  const compareFn =
    !isReversed
      ? (a: number, b: number) => a < b
      : (a: number, b: number) => b < a;

  const merged = new Array<Item>();
  let i = 0;
  let j = 0;

  const insert = (value: Item) => {
    if (filterResultFn(value)) merged.push(value);
  };

  while (i < left.length && j < right.length) {
    const unmerged1 = selectKeyFn(left[i]);
    const unmerged2 = selectKeyFn(right[j]);
    if (compareFn(unmerged1, unmerged2)) {
      insert(left[i]);
      i++;
    } else if (unmerged1 == unmerged2) {
      const resolved = resolveDuplicatesFn([left[i], right[j]]);
      if (resolved) insert(resolved);
      i++;
      j++;
    } else {
      insert(right[j]);
      j++;
    }
  }
  ;

  for (; i < left.length; i++) {
    insert(left[i]);
  }
  for (; j < right.length; j++) {
    insert(right[j]);
  }

  return merged;
}

export function mergeInPlace<Item, Key extends number>(
  target: Item[],
  right: ReadonlyArray<Item>,
  compareBy: (item: Item) => Key,
  resolveDuplicatesFn: (left: Item, right: Item) => Item | null,
  arrayOrdering: 'asc' | 'desc' = 'asc',
  filterResultFn: (value: Item) => boolean = () => true
): void {
  const isReversed = arrayOrdering == 'desc';
  if (target.length === 0) {
    target.splice(0, target.length, ...right);
    return;
  }
  if (right.length === 0) return;

  const merged = new Array(target.length + right.length);
  let i = 0;
  let j = 0;
  let k = 0;

  const compareFn = (a: number, b: number) =>
    isReversed ? b < a : a < b;

  while (i < target.length && j < right.length) {
    const unmerged1 = compareBy(target[i]);
    const unmerged2 = compareBy(right[j]);
    if (compareFn(unmerged1, unmerged2)) {
      if (filterResultFn(target[i])) merged[k++] = target[i];
      i++;
    } else if (unmerged1 === unmerged2) {
      const resolved = resolveDuplicatesFn(target[i], right[j]);
      if (resolved && filterResultFn(resolved)) merged[k++] = resolved;
      i++;
      j++;
    } else {
      if (filterResultFn(right[j])) merged[k++] = right[j];
      j++;
    }
  }

  while (i < target.length) {
    if (filterResultFn(target[i])) merged[k++] = target[i];
    i++;
  }
  while (j < right.length) {
    if (filterResultFn(right[j])) merged[k++] = right[j];
    j++;
  }

  target.splice(0, target.length, ...merged.slice(0, k));
}

/**
 * Merge a gapless chunk and return any gaps 
 * @param target the target to merge into
 * @param chunk the readonly array chunk to merge
 * @param selectKeyFn the selector
 * @param duplicateResolver resolve duplicates
 * @returns gaps if any
 */
export function mergeInPlaceGaplessChunk<Item, Key extends number>(
  target: Item[],
  chunk: ReadonlyArray<Item>,
  selectKeyFn: (item: Item) => Key,
): Range<Key>[] {
  const chunkRange = extractRange(chunk, selectKeyFn);
  if (!chunkRange) {
    return [];
  }

  const c = chunk as RNEA.ReadonlyNonEmptyArray<Item>;
  const spliceResult = getSpliceIndex(target, selectKeyFn, chunkRange);
  const gaps = [] as Range<Key>[];
  if (target.length > 0) {
    if (spliceResult.leftGapFromIndex || spliceResult.leftGapFromIndex === 0) {
      const fromIndex = spliceResult.leftGapFromIndex;
      gaps.push({ from: selectKeyFn(target[fromIndex]), to: selectKeyFn(RNEA.head(c)) });
    }
    if (spliceResult.rightGapToIndex || spliceResult.rightGapToIndex === 0) {
      const toIndex = spliceResult.rightGapToIndex;
      gaps.push({ from: selectKeyFn(RNEA.last(c)), to: selectKeyFn(target[toIndex]) });
    }
  }

  target.splice(spliceResult.start, spliceResult.count, ...chunk)

  return gaps;
}

export function trimByWindow<Item, Key extends number>(
  target: Item[],
  window: Range<Key>,
  selectKeyFn: (element: Item) => Key
): void {
  const start = findInsertPoint(target, selectKeyFn, window.from);
  const startIndex = start?.[0] == InsertType.InsertAfter ? start[1] + 1 : start?.[1] ?? 0;
  const endIndex = findInsertPoint(target, selectKeyFn, window.to, startIndex)?.[1] ?? target.length - 1;
  target.splice(0, startIndex);
  target.splice(endIndex - startIndex + 1, target.length - (endIndex - startIndex + 1));
}

export function extractRange<Item, Key extends number>(
  target: ReadonlyArray<Item>,
  selectKeyFn: (element: Item) => Key
): Range<Key> | null {
  if (target.length === 0)
    return null;

  const from = selectKeyFn(target[0]);
  const to = selectKeyFn(target[target.length - 1]);
  return { from, to }
}
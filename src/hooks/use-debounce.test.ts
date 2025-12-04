import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    expect(result.current).toBe('initial')

    // Update value
    rerender({ value: 'updated', delay: 500 })

    // Value should not change immediately
    expect(result.current).toBe('initial')

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Now the value should be updated
    expect(result.current).toBe('updated')
  })

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    // Rapid updates
    rerender({ value: 'update1', delay: 500 })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    rerender({ value: 'update2', delay: 500 })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    rerender({ value: 'update3', delay: 500 })

    // Still initial because timeout keeps resetting
    expect(result.current).toBe('initial')

    // Wait full delay
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Should be the last value
    expect(result.current).toBe('update3')
  })

  it('should work with different data types', () => {
    // Number
    const { result: numResult } = renderHook(() => useDebounce(42, 100))
    expect(numResult.current).toBe(42)

    // Object
    const obj = { foo: 'bar' }
    const { result: objResult } = renderHook(() => useDebounce(obj, 100))
    expect(objResult.current).toEqual({ foo: 'bar' })

    // Array
    const arr = [1, 2, 3]
    const { result: arrResult } = renderHook(() => useDebounce(arr, 100))
    expect(arrResult.current).toEqual([1, 2, 3])
  })

  it('should respect different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    )

    rerender({ value: 'updated', delay: 1000 })

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe('updated')
  })
})

import React from 'react'
import {render, fireEvent, cleanup} from '@testing-library/react'
import {useMnemonics} from '../../hooks'

const Fixture = ({
  onSelect = () => null,
  hasInput = false,
  refNotAttached = false
}: {
  onSelect?: (event: React.KeyboardEvent<HTMLButtonElement>) => void
  hasInput?: boolean
  refNotAttached?: boolean
}) => {
  const containerRef = React.createRef<HTMLDivElement>()
  useMnemonics(true, containerRef) // hard coding open=true for test

  return (
    <>
      <div ref={refNotAttached ? undefined : containerRef} data-testid="container">
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        {hasInput && <input autoFocus type="text" placeholder="Filter options" />}
        <button onKeyDown={onSelect}>button 1</button>
        <button onKeyDown={onSelect}>Button 2</button>
        <button onKeyDown={onSelect}>third button</button>
        <button disabled>fourth button is disabled</button>
        <button onKeyDown={onSelect}>button 5</button>
        <span>not focusable</span>
      </div>
    </>
  )
}

describe('useTypeaheadFocus', () => {
  afterEach(cleanup)

  it('First element: when b is pressed, it should move focus the "b"utton 1', () => {
    const {getByTestId, getByText} = render(<Fixture />)
    const container = getByTestId('container')

    fireEvent.keyDown(container, {key: 'b', code: 'b'})
    expect(getByText('button 1')).toEqual(document.activeElement)
  })

  it('Not first element: when t is pressed, it should move focus the "t"hird button', () => {
    const {getByTestId, getByText} = render(<Fixture />)
    const container = getByTestId('container')

    fireEvent.keyDown(container, {key: 't', code: 't'})
    expect(getByText('third button')).toEqual(document.activeElement)
  })

  it('Case insensitive: when B is pressed, it should move focus the "b"utton 1', () => {
    const {getByTestId, getByText} = render(<Fixture />)
    const container = getByTestId('container')

    fireEvent.keyDown(container, {key: 'B', code: 'B'})
    expect(getByText('button 1')).toEqual(document.activeElement)
  })

  it('Repeating letter: when b is pressed repeatedly, it should wrap through the buttons starting with "b", skipping the disabled button', () => {
    const {getByTestId, getByText} = render(<Fixture />)
    const container = getByTestId('container')

    fireEvent.keyDown(container, {key: 'b', code: 'b'})
    expect(getByText('button 1')).toEqual(document.activeElement)

    fireEvent.keyDown(container, {key: 'b', code: 'b'})
    expect(getByText('Button 2')).toEqual(document.activeElement)

    fireEvent.keyDown(container, {key: 'b', code: 'b'})
    expect(getByText('button 5')).toEqual(document.activeElement)

    // should cycle back to start of the list
    fireEvent.keyDown(container, {key: 'b', code: 'b'})
    expect(getByText('button 1')).toEqual(document.activeElement)
  })

  it('Space: when user presses Space, it should select the option', () => {
    const mockFunction = jest.fn()
    const {getByTestId, getByText} = render(<Fixture onSelect={mockFunction} />)

    const container = getByTestId('container')
    fireEvent.keyDown(container, {key: 't', code: 't'})

    const thirdButton = getByText('third button')
    expect(thirdButton).toEqual(document.activeElement)
    fireEvent.keyDown(thirdButton, {key: ' ', code: 'Space'})
    expect(mockFunction).toHaveBeenCalled()
  })

  it('Enter: when user is presses Enter, it should select the option', () => {
    jest.useFakeTimers()
    const mockFunction = jest.fn()
    const {getByTestId, getByText} = render(<Fixture onSelect={mockFunction} />)

    const container = getByTestId('container')
    fireEvent.keyDown(container, {key: 't', code: 't'})

    const thirdButton = getByText('third button')
    expect(thirdButton).toEqual(document.activeElement)

    fireEvent.keyDown(thirdButton, {key: 'Enter', code: 'Enter'})
    expect(mockFunction).toHaveBeenCalled()
  })

  it('Shortcuts: when a modifier is used, typeahead should not do anything', () => {
    const {getByTestId, getByText} = render(<Fixture />)
    const container = getByTestId('container')

    fireEvent.keyDown(container, {metaKey: true, key: 'b', code: 'b'})
    expect(getByText('button 1')).not.toEqual(document.activeElement)
  })

  it('TextInput: when an textinput has focus, typeahead should not do anything', async () => {
    const {getByTestId, getByPlaceholderText} = render(<Fixture hasInput={true} />)
    const container = getByTestId('container')

    const input = getByPlaceholderText('Filter options')
    expect(input).toEqual(document.activeElement)

    fireEvent.keyDown(container, {key: 'b', code: 'b'})
    expect(input).toEqual(document.activeElement)
  })

  it('Missing ref: when a ref is not attached, typeahead should break the component', async () => {
    const {getByTestId, getByText} = render(<Fixture refNotAttached={true} />)
    const container = getByTestId('container')

    fireEvent.keyDown(container, {key: 'b', code: 'b'})
    expect(getByText('button 1')).not.toEqual(document.activeElement)
  })
})

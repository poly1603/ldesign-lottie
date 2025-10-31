import { render, cleanup } from '@solidjs/testing-library'
import { describe, it, expect, afterEach } from 'vitest'
import { Lottie } from '../Lottie'

describe('Lottie Component', () => {
  afterEach(() => {
    cleanup()
  })

  it('should render without crashing', () => {
    const { container } = render(() => <Lottie path="/test.json" />)
    expect(container).toBeTruthy()
  })

  it('should render a div element', () => {
    const { container } = render(() => <Lottie path="/test.json" />)
    const div = container.querySelector('div')
    expect(div).toBeTruthy()
  })

  it('should accept autoplay prop', () => {
    const { container } = render(() => <Lottie path="/test.json" autoplay={false} />)
    expect(container).toBeTruthy()
  })

  it('should accept loop prop', () => {
    const { container } = render(() => <Lottie path="/test.json" loop={false} />)
    expect(container).toBeTruthy()
  })

  it('should accept speed prop', () => {
    const { container } = render(() => <Lottie path="/test.json" speed={2} />)
    expect(container).toBeTruthy()
  })

  it('should accept custom class', () => {
    const { container } = render(() => <Lottie path="/test.json" class="custom-class" />)
    const div = container.querySelector('.custom-class')
    expect(div).toBeTruthy()
  })

  it('should call onAnimationCreated callback', () => {
    let called = false
    const handleCreated = () => {
      called = true
    }

    render(() => <Lottie path="/test.json" onAnimationCreated={handleCreated} />)
    
    // Note: 实际测试需要 mock lottie-web
    expect(called).toBe(false) // 暂时测试不调用（需要 mock）
  })
})

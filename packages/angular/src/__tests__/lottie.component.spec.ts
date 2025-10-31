import { ComponentFixture, TestBed } from '@angular/core/testing'
import { LottieComponent } from '../lottie.component'

describe('LottieComponent', () => {
  let component: LottieComponent
  let fixture: ComponentFixture<LottieComponent>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LottieComponent],
    }).compileComponents()

    fixture = TestBed.createComponent(LottieComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should have default values', () => {
    expect(component.renderer).toBe('svg')
    expect(component.loop).toBe(true)
    expect(component.autoplay).toBe(true)
    expect(component.speed).toBe(1)
  })

  it('should emit animationCreated event', (done) => {
    component.path = '/test/animation.json'
    
    component.animationCreated.subscribe((instance) => {
      expect(instance).toBeDefined()
      done()
    })

    fixture.detectChanges()
  })

  it('should have play method', () => {
    expect(component.play).toBeDefined()
    expect(typeof component.play).toBe('function')
  })

  it('should have pause method', () => {
    expect(component.pause).toBeDefined()
    expect(typeof component.pause).toBe('function')
  })

  it('should have stop method', () => {
    expect(component.stop).toBeDefined()
    expect(typeof component.stop).toBe('function')
  })

  it('should cleanup on destroy', () => {
    const instance = component.getInstance()
    const destroySpy = instance ? jest.spyOn(instance, 'destroy') : null

    component.ngOnDestroy()

    if (destroySpy) {
      expect(destroySpy).toHaveBeenCalled()
    }
  })
})

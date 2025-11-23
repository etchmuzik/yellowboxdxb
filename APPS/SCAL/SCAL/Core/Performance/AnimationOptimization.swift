//
//  AnimationOptimization.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  120fps animation optimizations for ProMotion displays
//

import SwiftUI
import UIKit

// MARK: - Display Link Animator

class DisplayLinkAnimator: ObservableObject {
    @Published var value: Double = 0
    
    private var displayLink: CADisplayLink?
    private var startTime: CFTimeInterval?
    private var duration: CFTimeInterval
    private var fromValue: Double
    private var toValue: Double
    private var timingFunction: (Double) -> Double
    private var completion: (() -> Void)?
    
    init() {
        self.duration = 0
        self.fromValue = 0
        self.toValue = 0
        self.timingFunction = { $0 }
    }
    
    func animate(
        from: Double,
        to: Double,
        duration: CFTimeInterval,
        timingFunction: @escaping (Double) -> Double = TimingFunctions.easeInOut,
        completion: (() -> Void)? = nil
    ) {
        self.fromValue = from
        self.toValue = to
        self.duration = duration
        self.timingFunction = timingFunction
        self.completion = completion
        self.value = from
        
        displayLink?.invalidate()
        displayLink = CADisplayLink(target: self, selector: #selector(update))
        displayLink?.add(to: .current, forMode: .common)
        
        // Enable 120Hz if available
        if #available(iOS 15.0, *) {
            displayLink?.preferredFrameRateRange = CAFrameRateRange(
                minimum: 60,
                maximum: 120,
                preferred: 120
            )
        }
        
        startTime = CACurrentMediaTime()
    }
    
    @objc private func update(_ displayLink: CADisplayLink) {
        guard let startTime = startTime else { return }
        
        let elapsed = CACurrentMediaTime() - startTime
        let progress = min(elapsed / duration, 1.0)
        
        let easedProgress = timingFunction(progress)
        value = fromValue + (toValue - fromValue) * easedProgress
        
        if progress >= 1.0 {
            displayLink.invalidate()
            self.displayLink = nil
            completion?()
        }
    }
    
    func stop() {
        displayLink?.invalidate()
        displayLink = nil
    }
}

// MARK: - Timing Functions

struct TimingFunctions {
    static let linear: (Double) -> Double = { $0 }
    
    static let easeIn: (Double) -> Double = { t in
        t * t
    }
    
    static let easeOut: (Double) -> Double = { t in
        1 - (1 - t) * (1 - t)
    }
    
    static let easeInOut: (Double) -> Double = { t in
        t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2
    }
    
    static let spring: (Double) -> Double = { t in
        let c4 = (2 * Double.pi) / 3
        return t == 0 ? 0 : t == 1 ? 1 :
            pow(2, -10 * t) * sin((t * 10 - 0.75) * c4) + 1
    }
    
    static func cubicBezier(_ x1: Double, _ y1: Double, _ x2: Double, _ y2: Double) -> (Double) -> Double {
        return { t in
            let cx = 3 * x1
            let bx = 3 * (x2 - x1) - cx
            let ax = 1 - cx - bx
            
            let cy = 3 * y1
            let by = 3 * (y2 - y1) - cy
            let ay = 1 - cy - by
            
            func sampleCurveX(_ t: Double) -> Double {
                ((ax * t + bx) * t + cx) * t
            }
            
            func sampleCurveY(_ t: Double) -> Double {
                ((ay * t + by) * t + cy) * t
            }
            
            func solveCurveX(_ x: Double) -> Double {
                var t = x
                for _ in 0..<8 {
                    let currentX = sampleCurveX(t) - x
                    let currentSlope = 3 * ax * t * t + 2 * bx * t + cx
                    if abs(currentX) < 0.001 { break }
                    t -= currentX / currentSlope
                }
                return t
            }
            
            return sampleCurveY(solveCurveX(t))
        }
    }
}

// MARK: - Smooth Counter Animation

struct SmoothCounter: View {
    let value: Double
    let format: String
    let font: Font
    let color: Color
    
    @StateObject private var animator = DisplayLinkAnimator()
    @State private var previousValue: Double = 0
    
    var body: some View {
        Text(String(format: format, animator.value))
            .font(font)
            .foregroundColor(color)
            .onChange(of: value) { oldValue, newValue in
                animator.animate(
                    from: oldValue,
                    to: newValue,
                    duration: 0.6,
                    timingFunction: TimingFunctions.easeOut
                )
            }
            .onAppear {
                animator.value = value
                previousValue = value
            }
    }
}

// MARK: - Morphing Shape

struct MorphingShape: Shape {
    var progress: Double
    
    var animatableData: Double {
        get { progress }
        set { progress = newValue }
    }
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        
        // Example: Morph between circle and rounded rectangle
        if progress < 0.5 {
            // Circle to rounded rect
            let cornerRadius = rect.width * 0.5 * (1 - progress * 2)
            path.addRoundedRect(in: rect, cornerSize: CGSize(width: cornerRadius, height: cornerRadius))
        } else {
            // Rounded rect to square
            let cornerRadius = rect.width * 0.1 * ((progress - 0.5) * 2)
            path.addRoundedRect(in: rect, cornerSize: CGSize(width: cornerRadius, height: cornerRadius))
        }
        
        return path
    }
}

// MARK: - Liquid Effect Modifier

struct LiquidEffect: ViewModifier {
    let intensity: Double
    @State private var phase: Double = 0
    
    func body(content: Content) -> some View {
        content
            .distortionEffect(
                ShaderFunction(
                    library: .default,
                    name: "liquidEffect",
                    arguments: [
                        .float(intensity),
                        .float(phase)
                    ]
                ),
                maxSampleOffset: CGSize(width: intensity * 10, height: intensity * 10)
            )
            .onAppear {
                withAnimation(.linear(duration: 2).repeatForever(autoreverses: false)) {
                    phase = 2 * .pi
                }
            }
    }
}

// MARK: - Parallax Scroll Effect

struct ParallaxScrollModifier: ViewModifier {
    let multiplier: CGFloat
    @State private var scrollOffset: CGFloat = 0
    
    func body(content: Content) -> some View {
        content
            .offset(y: scrollOffset * multiplier)
            .onPreferenceChange(ScrollOffsetPreferenceKey.self) { value in
                scrollOffset = value
            }
    }
}

struct ScrollOffsetPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

// MARK: - Spring Animation System

struct SpringAnimation {
    let mass: Double
    let stiffness: Double
    let damping: Double
    let initialVelocity: Double
    
    static let gentle = SpringAnimation(mass: 1, stiffness: 100, damping: 10, initialVelocity: 0)
    static let bouncy = SpringAnimation(mass: 1, stiffness: 300, damping: 10, initialVelocity: 0)
    static let snappy = SpringAnimation(mass: 1, stiffness: 500, damping: 20, initialVelocity: 0)
    
    func calculate(at time: Double) -> Double {
        let omega = sqrt(stiffness / mass)
        let zeta = damping / (2 * sqrt(stiffness * mass))
        
        if zeta < 1 { // Underdamped
            let omegaD = omega * sqrt(1 - zeta * zeta)
            let amplitude = exp(-zeta * omega * time)
            let oscillation = cos(omegaD * time)
            return 1 - amplitude * oscillation
        } else { // Critically damped or overdamped
            let amplitude = exp(-omega * time)
            return 1 - amplitude * (1 + omega * time)
        }
    }
}

// MARK: - Gesture-Driven Animation

struct GestureDrivenAnimation<Content: View>: View {
    @GestureState private var dragState = DragState.inactive
    @State private var position = CGSize.zero
    let content: Content
    let onRelease: (CGSize) -> Void
    
    init(@ViewBuilder content: () -> Content, onRelease: @escaping (CGSize) -> Void) {
        self.content = content()
        self.onRelease = onRelease
    }
    
    enum DragState {
        case inactive
        case dragging(translation: CGSize)
        
        var translation: CGSize {
            switch self {
            case .inactive:
                return .zero
            case .dragging(let translation):
                return translation
            }
        }
    }
    
    var body: some View {
        content
            .offset(
                x: position.width + dragState.translation.width,
                y: position.height + dragState.translation.height
            )
            .animation(.interactiveSpring(response: 0.3, dampingFraction: 0.8), value: dragState.translation)
            .gesture(
                DragGesture()
                    .updating($dragState) { value, state, _ in
                        state = .dragging(translation: value.translation)
                    }
                    .onEnded { value in
                        position.width += value.translation.width
                        position.height += value.translation.height
                        onRelease(position)
                    }
            )
    }
}

// MARK: - Optimized Transitions

extension AnyTransition {
    static var optimizedSlide: AnyTransition {
        .asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal: .move(edge: .leading).combined(with: .opacity)
        )
    }
    
    static var optimizedScale: AnyTransition {
        .scale(scale: 0.8).combined(with: .opacity)
    }
    
    static func optimizedBlur(radius: CGFloat = 10) -> AnyTransition {
        .modifier(
            active: BlurModifier(radius: radius),
            identity: BlurModifier(radius: 0)
        )
    }
}

struct BlurModifier: ViewModifier {
    let radius: CGFloat
    
    func body(content: Content) -> some View {
        content
            .blur(radius: radius)
    }
}

// MARK: - Motion Blur Effect

struct MotionBlur: ViewModifier {
    @State private var previousPosition: CGPoint = .zero
    @State private var velocity: CGVector = .zero
    let sensitivity: CGFloat
    
    func body(content: Content) -> some View {
        content
            .blur(radius: min(sqrt(velocity.dx * velocity.dx + velocity.dy * velocity.dy) * sensitivity, 10))
            .onPreferenceChange(PositionPreferenceKey.self) { position in
                let newVelocity = CGVector(
                    dx: position.x - previousPosition.x,
                    dy: position.y - previousPosition.y
                )
                
                withAnimation(.linear(duration: 0.1)) {
                    velocity = newVelocity
                    previousPosition = position
                }
            }
    }
}

struct PositionPreferenceKey: PreferenceKey {
    static var defaultValue: CGPoint = .zero
    static func reduce(value: inout CGPoint, nextValue: () -> CGPoint) {
        value = nextValue()
    }
}

// MARK: - Animated Mesh Gradient

struct AnimatedMeshGradient: View {
    @State private var animationPhase: Double = 0
    let colors: [Color]
    let speed: Double
    
    var body: some View {
        TimelineView(.animation(minimumInterval: 1/120)) { context in
            Canvas { canvas, size in
                let time = context.date.timeIntervalSinceReferenceDate * speed
                
                // Create animated gradient mesh
                for x in stride(from: 0, to: size.width, by: 20) {
                    for y in stride(from: 0, to: size.height, by: 20) {
                        let phase = sin(time + x * 0.01 + y * 0.01)
                        let colorIndex = Int((phase + 1) * 0.5 * Double(colors.count - 1))
                        let color = colors[min(max(colorIndex, 0), colors.count - 1)]
                        
                        let rect = CGRect(x: x, y: y, width: 20, height: 20)
                        canvas.fill(Path(rect), with: .color(color))
                    }
                }
            }
        }
    }
}

// MARK: - View Extensions

extension View {
    func smoothAnimation<V: Equatable>(value: V) -> some View {
        self.animation(.interpolatingSpring(stiffness: 300, damping: 30), value: value)
    }
    
    func liquid(intensity: Double = 0.5) -> some View {
        self.modifier(LiquidEffect(intensity: intensity))
    }
    
    func parallaxScroll(multiplier: CGFloat = 0.5) -> some View {
        self.modifier(ParallaxScrollModifier(multiplier: multiplier))
    }
    
    func motionBlur(sensitivity: CGFloat = 0.1) -> some View {
        self.modifier(MotionBlur(sensitivity: sensitivity))
    }
}
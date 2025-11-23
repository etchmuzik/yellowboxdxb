import SwiftUI

// MARK: - Glass Morphism View Modifiers

struct GlassMorphism: ViewModifier {
    let cornerRadius: CGFloat
    let blurRadius: CGFloat
    let opacity: Double
    let borderWidth: CGFloat
    
    init(
        cornerRadius: CGFloat = 20,
        blurRadius: CGFloat = 10,
        opacity: Double = 0.2,
        borderWidth: CGFloat = 1
    ) {
        self.cornerRadius = cornerRadius
        self.blurRadius = blurRadius
        self.opacity = opacity
        self.borderWidth = borderWidth
    }
    
    func body(content: Content) -> some View {
        content
            .background(
                ZStack {
                    // Base blur layer
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .fill(.ultraThinMaterial)
                    
                    // Gradient overlay for depth
                    LinearGradient(
                        colors: [
                            Color.white.opacity(opacity),
                            Color.white.opacity(opacity * 0.3)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
                }
            )
            .overlay(
                // Border with gradient
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.5),
                                Color.white.opacity(0.1)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: borderWidth
                    )
            )
    }
}

struct ProminentGlass: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(
                ZStack {
                    // Base layer with stronger material
                    RoundedRectangle(cornerRadius: 24)
                        .fill(.thinMaterial)
                    
                    // Gradient overlay
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0.15),
                            Color.clear
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 24))
                }
            )
            .overlay(
                RoundedRectangle(cornerRadius: 24)
                    .stroke(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.6),
                                Color.white.opacity(0.2)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1.5
                    )
            )
    }
}

struct SubtleGlass: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(
                ZStack {
                    // Ultra thin material for subtle effect
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                        .opacity(0.8)
                    
                    // Soft gradient
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0.08),
                            Color.clear
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.2), lineWidth: 0.5)
            )
    }
}

// MARK: - View Extensions

extension View {
    func glassMorphism(
        cornerRadius: CGFloat = 20,
        blurRadius: CGFloat = 10,
        opacity: Double = 0.2,
        borderWidth: CGFloat = 1
    ) -> some View {
        self.modifier(
            GlassMorphism(
                cornerRadius: cornerRadius,
                blurRadius: blurRadius,
                opacity: opacity,
                borderWidth: borderWidth
            )
        )
    }
    
    func prominentGlass() -> some View {
        self.modifier(ProminentGlass())
    }
    
    func subtleGlass() -> some View {
        self.modifier(SubtleGlass())
    }
}

// MARK: - Glass Button Style

struct GlassButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 24)
            .padding(.vertical, 14)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(.ultraThinMaterial)
                    
                    LinearGradient(
                        colors: [
                            Color.white.opacity(configuration.isPressed ? 0.1 : 0.2),
                            Color.white.opacity(0.05)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(
                        Color.white.opacity(configuration.isPressed ? 0.3 : 0.5),
                        lineWidth: 1
                    )
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

// MARK: - Glass Navigation Bar

struct GlassNavigationBar: View {
    let title: String
    let showBackButton: Bool
    let backAction: (() -> Void)?
    
    init(title: String, showBackButton: Bool = false, backAction: (() -> Void)? = nil) {
        self.title = title
        self.showBackButton = showBackButton
        self.backAction = backAction
    }
    
    var body: some View {
        HStack {
            if showBackButton {
                Button(action: { backAction?() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 44, height: 44)
                        .subtleGlass()
                }
            }
            
            Spacer()
            
            Text(title)
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.white)
            
            Spacer()
            
            if showBackButton {
                // Placeholder for balance
                Color.clear
                    .frame(width: 44, height: 44)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(
            ZStack {
                Rectangle()
                    .fill(.ultraThinMaterial)
                
                LinearGradient(
                    colors: [
                        Color.white.opacity(0.1),
                        Color.clear
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
            }
            .ignoresSafeArea(edges: .top)
        )
    }
}

// MARK: - Glass Tab Bar Background

struct GlassTabBarBackground: View {
    var body: some View {
        ZStack {
            // Base blur
            Rectangle()
                .fill(.ultraThinMaterial)
            
            // Gradient overlay
            LinearGradient(
                colors: [
                    Color.white.opacity(0.1),
                    Color.clear
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            
            // Top border
            VStack {
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.3),
                                Color.white.opacity(0.1)
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(height: 0.5)
                Spacer()
            }
        }
    }
}
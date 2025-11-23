//
//  SCALDesignSystem.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Centralized design system with colors, typography, and spacing
//

import SwiftUI

// MARK: - SCAL Design System

struct SCALDesignSystem {
    
    // MARK: - Colors
    
    struct Colors {
        // Primary Colors
        static let primary = Color.orange
        static let primaryGradient = LinearGradient(
            colors: [.orange, .red],
            startPoint: .leading,
            endPoint: .trailing
        )

        // Background Colors - Adaptive for Dark Mode
        static let background = Color(uiColor: .systemBackground) // Adapts: white (light), black (dark)
        static let secondaryBackground = Color(uiColor: .secondarySystemBackground) // Adapts to system
        static let cardBackground = Color(uiColor: .tertiarySystemBackground) // Adapts to system

        // Text Colors - Adaptive for Dark Mode
        static let primaryText = Color(uiColor: .label) // Adapts: black (light), white (dark)
        static let secondaryText = Color(uiColor: .secondaryLabel) // Adapts to system
        static let accentText = Color.orange
        
        // Semantic Colors
        static let success = Color.green
        static let warning = Color.orange
        static let error = Color.red
        static let info = Color.blue
        
        // Nutrition Colors
        static let calories = Color.orange
        static let protein = Color.blue
        static let carbs = Color.green
        static let fat = Color.yellow
        static let water = Color.cyan
        
        // Health Metrics
        static let weight = Color.purple
        static let bmi = Color.indigo
        static let heartRate = Color.red
        static let steps = Color.mint
    }
    
    // MARK: - Typography
    
    struct Typography {
        // Headlines
        static let largeTitle = Font.largeTitle.bold()
        static let title1 = Font.title.bold()
        static let title2 = Font.title2.bold()
        static let title3 = Font.title3.bold()
        
        // Body Text
        static let body = Font.body
        static let bodyBold = Font.body.bold()
        static let subheadline = Font.subheadline
        static let subheadlineBold = Font.subheadline.bold()
        
        // Supporting Text
        static let caption = Font.caption
        static let captionBold = Font.caption.bold()
        static let caption2 = Font.caption2
        static let footnote = Font.footnote
        
        // Custom Fonts
        static let display = Font.system(size: 48, weight: .bold, design: .rounded)
        static let heroNumber = Font.system(size: 36, weight: .bold, design: .rounded)
        static let metric = Font.system(size: 24, weight: .bold, design: .rounded)
        
        // Button Text
        static let buttonLarge = Font.headline.bold()
        static let buttonMedium = Font.subheadline.bold()
        static let buttonSmall = Font.caption.bold()
    }
    
    // MARK: - Spacing
    
    struct Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 20
        static let xxl: CGFloat = 24
        static let xxxl: CGFloat = 32
        
        // Component Specific
        static let cardPadding: CGFloat = 16
        static let sectionSpacing: CGFloat = 20
        static let itemSpacing: CGFloat = 12
        
        // Layout
        static let screenPadding: CGFloat = 16
        static let minTouchTarget: CGFloat = 44
    }
    
    // MARK: - Corner Radius
    
    struct CornerRadius {
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 20
        static let round: CGFloat = 1000 // For circular elements
    }
    
    // MARK: - Shadows

    struct Shadows {
        static let small = Shadow(
            color: Color(uiColor: .systemGray).opacity(0.1), // Adaptive shadow
            radius: 2,
            x: 0,
            y: 1
        )

        static let medium = Shadow(
            color: Color(uiColor: .systemGray).opacity(0.15), // Adaptive shadow
            radius: 4,
            x: 0,
            y: 2
        )

        static let large = Shadow(
            color: Color(uiColor: .systemGray).opacity(0.2), // Adaptive shadow
            radius: 8,
            x: 0,
            y: 4
        )
        
        static let glow = Shadow(
            color: Color.orange.opacity(0.3),
            radius: 8,
            x: 0,
            y: 4
        )
    }
    
    // MARK: - Animation
    
    struct Animation {
        static let quick = SwiftUI.Animation.easeInOut(duration: 0.2)
        static let standard = SwiftUI.Animation.easeInOut(duration: 0.3)
        static let slow = SwiftUI.Animation.easeInOut(duration: 0.5)
        
        // Specific Animations
        static let buttonPress = SwiftUI.Animation.easeInOut(duration: 0.1)
        static let sheetPresentation = SwiftUI.Animation.easeInOut(duration: 0.4)
        static let progressUpdate = SwiftUI.Animation.easeInOut(duration: 1.0)
    }
    
    // MARK: - Gradients
    
    struct Gradients {
        static let primary = LinearGradient(
            colors: [Colors.primary, .red],
            startPoint: .leading,
            endPoint: .trailing
        )
        
        static let calories = LinearGradient(
            colors: [.orange, .red],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        
        static let protein = LinearGradient(
            colors: [.blue, .cyan],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        
        static let carbs = LinearGradient(
            colors: [.green, .mint],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        
        static let fat = LinearGradient(
            colors: [.yellow, .orange],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        
        static let background = LinearGradient(
            colors: [Color(uiColor: .systemBackground), Color(uiColor: .secondarySystemBackground)], // Adaptive gradient
            startPoint: .top,
            endPoint: .bottom
        )
    }
    
    // MARK: - Icons
    
    struct Icons {
        // Navigation
        static let home = "house.fill"
        static let scanner = "camera.fill"
        static let voice = "mic.fill"
        static let profile = "person.crop.circle.fill"
        static let settings = "gear"
        
        // Actions
        static let add = "plus.circle.fill"
        static let edit = "pencil"
        static let delete = "trash"
        static let share = "square.and.arrow.up"
        static let favorite = "heart.fill"
        
        // Nutrition
        static let calories = "flame.fill"
        static let protein = "circle.fill"
        static let carbs = "leaf.fill"
        static let fat = "drop.fill"
        static let water = "drop.fill"
        
        // Health
        static let weight = "scalemass.fill"
        static let height = "ruler.fill"
        static let heart = "heart.fill"
        static let activity = "figure.walk"
        
        // Status
        static let success = "checkmark.circle.fill"
        static let warning = "exclamationmark.triangle.fill"
        static let error = "xmark.circle.fill"
        static let info = "info.circle.fill"
        
        // Food
        static let meal = "fork.knife"
        static let food = "takeoutbag.and.cup.and.straw.fill"
        static let barcode = "barcode.viewfinder"
        static let search = "magnifyingglass"
    }
}

// MARK: - Shadow Helper

struct Shadow {
    let color: Color
    let radius: CGFloat
    let x: CGFloat
    let y: CGFloat
}

// MARK: - View Extensions

extension View {
    func applySCALShadow(_ shadow: Shadow) -> some View {
        self.shadow(
            color: shadow.color,
            radius: shadow.radius,
            x: shadow.x,
            y: shadow.y
        )
    }
    
    func scaleCard(pressed: Bool) -> some View {
        self.scaleEffect(pressed ? 0.95 : 1.0)
            .animation(SCALDesignSystem.Animation.buttonPress, value: pressed)
    }
    
    func glow(color: Color = .orange, radius: CGFloat = 8) -> some View {
        self.shadow(color: color.opacity(0.3), radius: radius, x: 0, y: 0)
    }
}

// MARK: - Custom View Modifiers

struct SCALCardStyle: ViewModifier {
    var backgroundColor: Color = SCALDesignSystem.Colors.cardBackground
    var cornerRadius: CGFloat = SCALDesignSystem.CornerRadius.lg
    var padding: CGFloat = SCALDesignSystem.Spacing.cardPadding
    
    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(backgroundColor)
            )
            .applySCALShadow(SCALDesignSystem.Shadows.small)
    }
}

struct SCALButtonStyle: ViewModifier {
    var style: ButtonStyleType = .primary
    var size: ButtonSize = .medium
    var isDisabled: Bool = false
    
    enum ButtonStyleType {
        case primary, secondary, ghost
    }
    
    enum ButtonSize {
        case small, medium, large
        
        var padding: EdgeInsets {
            switch self {
            case .small: return EdgeInsets(top: 8, leading: 12, bottom: 8, trailing: 12)
            case .medium: return EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16)
            case .large: return EdgeInsets(top: 16, leading: 20, bottom: 16, trailing: 20)
            }
        }
        
        var font: Font {
            switch self {
            case .small: return SCALDesignSystem.Typography.buttonSmall
            case .medium: return SCALDesignSystem.Typography.buttonMedium
            case .large: return SCALDesignSystem.Typography.buttonLarge
            }
        }
    }
    
    func body(content: Content) -> some View {
        content
            .font(size.font)
            .padding(size.padding)
            .frame(maxWidth: .infinity)
            .background(backgroundForStyle)
            .foregroundColor(foregroundColorForStyle)
            .cornerRadius(SCALDesignSystem.CornerRadius.lg)
            .opacity(isDisabled ? 0.6 : 1.0)
            .disabled(isDisabled)
    }
    
    private var backgroundForStyle: some View {
        Group {
            switch style {
            case .primary:
                SCALDesignSystem.Gradients.primary
            case .secondary:
                RoundedRectangle(cornerRadius: SCALDesignSystem.CornerRadius.lg)
                    .stroke(SCALDesignSystem.Colors.primary, lineWidth: 2)
                    .background(Color.clear)
            case .ghost:
                Color.clear
            }
        }
    }
    
    private var foregroundColorForStyle: Color {
        switch style {
        case .primary: return .white // White text on orange gradient button (works in both modes)
        case .secondary, .ghost: return SCALDesignSystem.Colors.primary
        }
    }
}

// MARK: - View Extension for Modifiers

extension View {
    func scalCard(
        backgroundColor: Color = SCALDesignSystem.Colors.cardBackground,
        cornerRadius: CGFloat = SCALDesignSystem.CornerRadius.lg,
        padding: CGFloat = SCALDesignSystem.Spacing.cardPadding
    ) -> some View {
        self.modifier(SCALCardStyle(
            backgroundColor: backgroundColor,
            cornerRadius: cornerRadius,
            padding: padding
        ))
    }
    
    func scalButton(
        style: SCALButtonStyle.ButtonStyleType = .primary,
        size: SCALButtonStyle.ButtonSize = .medium,
        isDisabled: Bool = false
    ) -> some View {
        self.modifier(SCALButtonStyle(
            style: style,
            size: size,
            isDisabled: isDisabled
        ))
    }
}

// MARK: - Haptic Feedback

struct HapticFeedback {
    static func light() {
        let impactFeedback = UIImpactFeedbackGenerator(style: .light)
        impactFeedback.impactOccurred()
    }
    
    static func medium() {
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }
    
    static func heavy() {
        let impactFeedback = UIImpactFeedbackGenerator(style: .heavy)
        impactFeedback.impactOccurred()
    }
    
    static func success() {
        let notificationFeedback = UINotificationFeedbackGenerator()
        notificationFeedback.notificationOccurred(.success)
    }
    
    static func warning() {
        let notificationFeedback = UINotificationFeedbackGenerator()
        notificationFeedback.notificationOccurred(.warning)
    }
    
    static func error() {
        let notificationFeedback = UINotificationFeedbackGenerator()
        notificationFeedback.notificationOccurred(.error)
    }
}

// MARK: - Preview

#if DEBUG
struct SCALDesignSystem_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(spacing: SCALDesignSystem.Spacing.xl) {
                // Typography Examples
                VStack(alignment: .leading, spacing: SCALDesignSystem.Spacing.md) {
                    Text("Typography")
                        .font(SCALDesignSystem.Typography.title2)
                        .foregroundColor(SCALDesignSystem.Colors.primaryText)
                    
                    Text("Display Text")
                        .font(SCALDesignSystem.Typography.display)
                        .foregroundColor(SCALDesignSystem.Colors.accentText)
                    
                    Text("Body text example")
                        .font(SCALDesignSystem.Typography.body)
                        .foregroundColor(SCALDesignSystem.Colors.primaryText)
                    
                    Text("Caption text example")
                        .font(SCALDesignSystem.Typography.caption)
                        .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                }
                .scalCard()
                
                // Color Examples
                VStack(alignment: .leading, spacing: SCALDesignSystem.Spacing.md) {
                    Text("Colors")
                        .font(SCALDesignSystem.Typography.title3)
                        .foregroundColor(SCALDesignSystem.Colors.primaryText)
                    
                    HStack {
                        colorSwatch("Primary", SCALDesignSystem.Colors.primary)
                        colorSwatch("Success", SCALDesignSystem.Colors.success)
                        colorSwatch("Warning", SCALDesignSystem.Colors.warning)
                        colorSwatch("Error", SCALDesignSystem.Colors.error)
                    }
                }
                .scalCard()
                
                // Button Examples
                VStack(spacing: SCALDesignSystem.Spacing.md) {
                    Text("Buttons")
                        .font(SCALDesignSystem.Typography.title3)
                        .foregroundColor(SCALDesignSystem.Colors.primaryText)
                    
                    Button("Primary Button") { }
                        .scalButton(style: .primary, size: .large)
                    
                    Button("Secondary Button") { }
                        .scalButton(style: .secondary, size: .medium)
                    
                    Button("Ghost Button") { }
                        .scalButton(style: .ghost, size: .small)
                }
                .scalCard()
            }
            .padding(SCALDesignSystem.Spacing.screenPadding)
        }
        .background(SCALDesignSystem.Colors.background)
    }
    
    static func colorSwatch(_ name: String, _ color: Color) -> some View {
        VStack {
            Rectangle()
                .fill(color)
                .frame(width: 60, height: 40)
                .cornerRadius(SCALDesignSystem.CornerRadius.sm)
            
            Text(name)
                .font(SCALDesignSystem.Typography.caption)
                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
        }
    }
}
#endif
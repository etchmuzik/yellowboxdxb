//
//  AccessibilityManager.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Accessibility support and enhancements
//

import SwiftUI
import UIKit
import AVFoundation

// MARK: - Accessibility Manager

@MainActor
class AccessibilityManager: ObservableObject {
    static let shared = AccessibilityManager()
    
    @Published var isVoiceOverEnabled = UIAccessibility.isVoiceOverRunning
    @Published var isReduceMotionEnabled = UIAccessibility.isReduceMotionEnabled
    @Published var isIncreasedContrastEnabled = UIAccessibility.isDarkerSystemColorsEnabled
    @Published var preferredContentSize = UIApplication.shared.preferredContentSizeCategory
    @Published var isBoldTextEnabled = UIAccessibility.isBoldTextEnabled
    @Published var isGrayscaleEnabled = UIAccessibility.isGrayscaleEnabled
    
    // Voice announcements
    private let synthesizer = AVSpeechSynthesizer()
    
    init() {
        setupNotifications()
    }
    
    private func setupNotifications() {
        // VoiceOver
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(voiceOverStatusChanged),
            name: UIAccessibility.voiceOverStatusDidChangeNotification,
            object: nil
        )
        
        // Reduce Motion
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(reduceMotionStatusChanged),
            name: UIAccessibility.reduceMotionStatusDidChangeNotification,
            object: nil
        )
        
        // Increased Contrast
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(darkerSystemColorsStatusChanged),
            name: UIAccessibility.darkerSystemColorsStatusDidChangeNotification,
            object: nil
        )
        
        // Text Size
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(contentSizeCategoryChanged),
            name: UIContentSizeCategory.didChangeNotification,
            object: nil
        )
        
        // Bold Text
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(boldTextStatusChanged),
            name: UIAccessibility.boldTextStatusDidChangeNotification,
            object: nil
        )
        
        // Grayscale
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(grayscaleStatusChanged),
            name: UIAccessibility.grayscaleStatusDidChangeNotification,
            object: nil
        )
    }
    
    // MARK: - Notification Handlers
    
    @objc private func voiceOverStatusChanged() {
        isVoiceOverEnabled = UIAccessibility.isVoiceOverRunning
    }
    
    @objc private func reduceMotionStatusChanged() {
        isReduceMotionEnabled = UIAccessibility.isReduceMotionEnabled
    }
    
    @objc private func darkerSystemColorsStatusChanged() {
        isIncreasedContrastEnabled = UIAccessibility.isDarkerSystemColorsEnabled
    }
    
    @objc private func contentSizeCategoryChanged() {
        preferredContentSize = UIApplication.shared.preferredContentSizeCategory
    }
    
    @objc private func boldTextStatusChanged() {
        isBoldTextEnabled = UIAccessibility.isBoldTextEnabled
    }
    
    @objc private func grayscaleStatusChanged() {
        isGrayscaleEnabled = UIAccessibility.isGrayscaleEnabled
    }
    
    // MARK: - Voice Announcements
    
    func announce(_ message: String, priority: UIAccessibility.NotificationPriority = .high) {
        if isVoiceOverEnabled {
            UIAccessibility.post(
                notification: .announcement,
                argument: NSAttributedString(
                    string: message,
                    attributes: [.accessibilitySpeechQueueAnnouncement: priority == .high]
                )
            )
        } else {
            // Use text-to-speech for non-VoiceOver users who might benefit
            speak(message)
        }
    }
    
    func announceScreenChange(_ message: String) {
        UIAccessibility.post(notification: .screenChanged, argument: message)
    }
    
    func announceLayoutChange(_ message: String) {
        UIAccessibility.post(notification: .layoutChanged, argument: message)
    }
    
    private func speak(_ text: String) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.rate = 0.5
        utterance.pitchMultiplier = 1.0
        utterance.volume = 0.8
        synthesizer.speak(utterance)
    }
    
    // MARK: - Haptic Feedback
    
    func playHaptic(_ type: UINotificationFeedbackGenerator.FeedbackType = .success) {
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(type)
    }
    
    func playImpactHaptic(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .medium) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.prepare()
        generator.impactOccurred()
    }
    
    // MARK: - Accessibility Helpers
    
    func scaledFont(for textStyle: Font.TextStyle, size: CGFloat? = nil) -> Font {
        if let size = size {
            return Font.system(size: scaledValue(for: size))
        } else {
            return Font(UIFont.preferredFont(forTextStyle: uiTextStyle(for: textStyle)))
        }
    }
    
    func scaledValue(for value: CGFloat) -> CGFloat {
        switch preferredContentSize {
        case .extraSmall:
            return value * 0.8
        case .small:
            return value * 0.9
        case .medium:
            return value
        case .large:
            return value * 1.1
        case .extraLarge:
            return value * 1.2
        case .extraExtraLarge:
            return value * 1.3
        case .extraExtraExtraLarge:
            return value * 1.4
        case .accessibilityMedium:
            return value * 1.5
        case .accessibilityLarge:
            return value * 1.8
        case .accessibilityExtraLarge:
            return value * 2.0
        case .accessibilityExtraExtraLarge:
            return value * 2.5
        case .accessibilityExtraExtraExtraLarge:
            return value * 3.0
        default:
            return value
        }
    }
    
    private func uiTextStyle(for textStyle: Font.TextStyle) -> UIFont.TextStyle {
        switch textStyle {
        case .largeTitle: return .largeTitle
        case .title: return .title1
        case .title2: return .title2
        case .title3: return .title3
        case .headline: return .headline
        case .subheadline: return .subheadline
        case .body: return .body
        case .callout: return .callout
        case .footnote: return .footnote
        case .caption: return .caption1
        case .caption2: return .caption2
        @unknown default: return .body
        }
    }
}

// MARK: - Accessibility View Modifiers

struct AccessibleAnimation: ViewModifier {
    @StateObject private var accessibility = AccessibilityManager.shared
    let animation: Animation?
    
    func body(content: Content) -> some View {
        if accessibility.isReduceMotionEnabled {
            content
        } else {
            content.animation(animation, value: UUID())
        }
    }
}

struct AccessibleTransition: ViewModifier {
    @StateObject private var accessibility = AccessibilityManager.shared
    let transition: AnyTransition
    
    func body(content: Content) -> some View {
        if accessibility.isReduceMotionEnabled {
            content.transition(.opacity)
        } else {
            content.transition(transition)
        }
    }
}

struct AccessibleContrast: ViewModifier {
    @StateObject private var accessibility = AccessibilityManager.shared
    let color: Color
    
    func body(content: Content) -> some View {
        content.foregroundColor(
            accessibility.isIncreasedContrastEnabled ? color.accessibleVariant : color
        )
    }
}

struct AccessibleFocus: ViewModifier {
    @AccessibilityFocusState var isFocused: Bool
    let onFocusChange: ((Bool) -> Void)?
    
    func body(content: Content) -> some View {
        content
            .accessibilityFocused($isFocused)
            .onChange(of: isFocused) { _, newValue in
                onFocusChange?(newValue)
            }
    }
}

struct AccessibleTapTarget: ViewModifier {
    let minSize: CGFloat
    
    func body(content: Content) -> some View {
        content
            .frame(minWidth: minSize, minHeight: minSize)
            .contentShape(Rectangle())
    }
}

// MARK: - View Extensions

extension View {
    func accessibleAnimation(_ animation: Animation? = .default) -> some View {
        modifier(AccessibleAnimation(animation: animation))
    }
    
    func accessibleTransition(_ transition: AnyTransition) -> some View {
        modifier(AccessibleTransition(transition: transition))
    }
    
    func accessibleContrast(_ color: Color) -> some View {
        modifier(AccessibleContrast(color: color))
    }
    
    func accessibleFocus(onFocusChange: ((Bool) -> Void)? = nil) -> some View {
        modifier(AccessibleFocus(onFocusChange: onFocusChange))
    }
    
    func accessibleTapTarget(minSize: CGFloat = 44) -> some View {
        modifier(AccessibleTapTarget(minSize: minSize))
    }
    
    func accessibilityHidden(_ hidden: Bool, when condition: Bool) -> some View {
        self.accessibilityHidden(condition ? hidden : false)
    }
    
    func accessibilityRole(_ role: String) -> some View {
        self.accessibilityAddTraits(.isButton)
            .accessibilityLabel(role)
    }
}

// MARK: - Color Extensions

extension Color {
    var accessibleVariant: Color {
        // Return high contrast versions of colors
        switch self {
        case .primary:
            return .black
        case .secondary:
            return Color(white: 0.3)
        case .blue:
            return Color(red: 0, green: 0.3, blue: 0.8)
        case .green:
            return Color(red: 0, green: 0.5, blue: 0)
        case .orange:
            return Color(red: 0.8, green: 0.4, blue: 0)
        case .red:
            return Color(red: 0.8, green: 0, blue: 0)
        default:
            return self
        }
    }
    
    func meetsContrastRatio(against backgroundColor: Color, level: ContrastLevel = .AA) -> Bool {
        let ratio = contrastRatio(with: backgroundColor)
        switch level {
        case .AA:
            return ratio >= 4.5
        case .AAA:
            return ratio >= 7.0
        }
    }
    
    private func contrastRatio(with color: Color) -> Double {
        let l1 = self.luminance()
        let l2 = color.luminance()
        return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)
    }
    
    private func luminance() -> Double {
        let uiColor = UIColor(self)
        var r: CGFloat = 0
        var g: CGFloat = 0
        var b: CGFloat = 0
        var a: CGFloat = 0
        
        uiColor.getRed(&r, green: &g, blue: &b, alpha: &a)
        
        func adjust(_ component: CGFloat) -> CGFloat {
            return component <= 0.03928 ? component / 12.92 : pow((component + 0.055) / 1.055, 2.4)
        }
        
        return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)
    }
}

enum ContrastLevel {
    case AA
    case AAA
}

// MARK: - Accessibility Labels

struct AccessibilityLabels {
    // Common actions
    static let close = "Close"
    static let back = "Go back"
    static let next = "Next"
    static let previous = "Previous"
    static let save = "Save"
    static let cancel = "Cancel"
    static let delete = "Delete"
    static let edit = "Edit"
    static let add = "Add"
    static let search = "Search"
    static let filter = "Filter"
    static let sort = "Sort"
    static let share = "Share"
    static let more = "More options"
    
    // Food tracking
    static let scanFood = "Scan food with camera"
    static let addMeal = "Add meal"
    static let viewNutrition = "View nutrition details"
    static let logWater = "Log water intake"
    static let viewCalories = "View calorie breakdown"
    
    // Navigation
    static let dashboard = "Dashboard"
    static let mealHistory = "Meal history"
    static let profile = "Profile"
    static let settings = "Settings"
    static let premium = "Premium features"
    
    // Nutrition info
    static func calories(_ amount: Int) -> String {
        "\(amount) calories"
    }
    
    static func protein(_ amount: Double) -> String {
        String(format: "%.1f grams of protein", amount)
    }
    
    static func carbs(_ amount: Double) -> String {
        String(format: "%.1f grams of carbohydrates", amount)
    }
    
    static func fat(_ amount: Double) -> String {
        String(format: "%.1f grams of fat", amount)
    }
    
    static func progress(_ current: Int, goal: Int) -> String {
        "\(current) of \(goal), \(Int((Double(current) / Double(goal)) * 100))% complete"
    }
}
//
//  AccessibilitySettingsView.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Accessibility settings and preferences UI
//

import SwiftUI

struct AccessibilitySettingsView: View {
    @StateObject private var accessibility = AccessibilityManager.shared
    @Environment(\.dismiss) var dismiss
    @AppStorage("useSimplifiedUI") private var useSimplifiedUI = false
    @AppStorage("autoAnnouncements") private var autoAnnouncements = true
    @AppStorage("hapticFeedback") private var hapticFeedback = true
    @AppStorage("highContrastMode") private var highContrastMode = false
    @AppStorage("focusHighlight") private var focusHighlight = true
    @AppStorage("voiceGuidance") private var voiceGuidance = false
    
    var body: some View {
        NavigationView {
            Form {
                systemSettingsSection
                appSettingsSection
                visualSettingsSection
                audioSettingsSection
                interactionSettingsSection
                previewSection
            }
            .navigationTitle("Accessibility")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    // MARK: - Sections
    
    private var systemSettingsSection: some View {
        Section {
            SettingRow(
                title: "VoiceOver",
                subtitle: "Screen reader for blind users",
                isOn: accessibility.isVoiceOverEnabled,
                isSystemSetting: true
            )
            
            SettingRow(
                title: "Reduce Motion",
                subtitle: "Minimize animations",
                isOn: accessibility.isReduceMotionEnabled,
                isSystemSetting: true
            )
            
            SettingRow(
                title: "Bold Text",
                subtitle: "Make text bolder",
                isOn: accessibility.isBoldTextEnabled,
                isSystemSetting: true
            )
            
            SettingRow(
                title: "Larger Text",
                subtitle: accessibility.preferredContentSize.isAccessibilityCategory ? "Enabled" : "Disabled",
                isOn: accessibility.preferredContentSize.isAccessibilityCategory,
                isSystemSetting: true
            )
        } header: {
            Text("System Settings")
        } footer: {
            Text("These settings are controlled in iOS Settings > Accessibility")
        }
    }
    
    private var appSettingsSection: some View {
        Section {
            Toggle(isOn: $useSimplifiedUI) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Simplified Interface")
                        .font(.body)
                    Text("Reduce visual complexity")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .accessibilityValue(useSimplifiedUI ? "On" : "Off")
            
            Toggle(isOn: $autoAnnouncements) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Auto Announcements")
                        .font(.body)
                    Text("Announce important changes")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .accessibilityValue(autoAnnouncements ? "On" : "Off")
            
            Toggle(isOn: $voiceGuidance) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Voice Guidance")
                        .font(.body)
                    Text("Spoken instructions for scanning")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .accessibilityValue(voiceGuidance ? "On" : "Off")
        } header: {
            Text("App Features")
        }
    }
    
    private var visualSettingsSection: some View {
        Section {
            Toggle(isOn: $highContrastMode) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("High Contrast")
                        .font(.body)
                    Text("Increase color contrast")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .accessibilityValue(highContrastMode ? "On" : "Off")
            
            Toggle(isOn: $focusHighlight) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Focus Indicators")
                        .font(.body)
                    Text("Show keyboard focus clearly")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .accessibilityValue(focusHighlight ? "On" : "Off")
            
            NavigationLink(destination: ColorBlindnessSettings()) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Color Adjustments")
                        .font(.body)
                    Text("Settings for color blindness")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        } header: {
            Text("Visual")
        }
    }
    
    private var audioSettingsSection: some View {
        Section {
            Toggle(isOn: $hapticFeedback) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Haptic Feedback")
                        .font(.body)
                    Text("Vibration for actions")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .accessibilityValue(hapticFeedback ? "On" : "Off")
            
            NavigationLink(destination: SoundSettingsView()) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Sound Effects")
                        .font(.body)
                    Text("Audio cues for actions")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        } header: {
            Text("Audio & Haptics")
        }
    }
    
    private var interactionSettingsSection: some View {
        Section {
            NavigationLink(destination: GestureSettingsView()) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Touch Accommodations")
                        .font(.body)
                    Text("Adjust touch sensitivity")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            NavigationLink(destination: KeyboardShortcutsView()) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Keyboard Shortcuts")
                        .font(.body)
                    Text("Navigate with keyboard")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        } header: {
            Text("Interaction")
        }
    }
    
    private var previewSection: some View {
        Section {
            VStack(spacing: 16) {
                // Sample button with current settings
                Button(action: {
                    if hapticFeedback {
                        accessibility.playImpactHaptic(.medium)
                    }
                    if autoAnnouncements {
                        accessibility.announce("Sample button tapped")
                    }
                }) {
                    HStack {
                        Image(systemName: "camera.fill")
                            .font(.title3)
                        Text("Scan Food")
                            .font(accessibility.isBoldTextEnabled ? .headline : .body)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: useSimplifiedUI ? 8 : 12)
                            .fill(highContrastMode ? Color.blue.accessibleVariant : Color.blue)
                    )
                }
                .accessibilityLabel("Scan Food button")
                .accessibilityHint("Double tap to open camera for food scanning")
                
                // Sample text with current settings
                VStack(alignment: .leading, spacing: 8) {
                    Text("Daily Goal Progress")
                        .font(accessibility.scaledFont(for: .headline))
                        .foregroundColor(highContrastMode ? .black : .primary)
                    
                    HStack {
                        ProgressView(value: 0.63)
                            .progressViewStyle(LinearProgressViewStyle(
                                tint: highContrastMode ? .blue.accessibleVariant : .blue
                            ))
                        
                        Text("63%")
                            .font(accessibility.scaledFont(for: .body))
                            .foregroundColor(highContrastMode ? .black : .secondary)
                    }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: useSimplifiedUI ? 8 : 12)
                        .fill(Color(UIColor.secondarySystemGroupedBackground))
                        .overlay(
                            RoundedRectangle(cornerRadius: useSimplifiedUI ? 8 : 12)
                                .stroke(
                                    focusHighlight ? Color.blue : Color.clear,
                                    lineWidth: 2
                                )
                        )
                )
            }
        } header: {
            Text("Preview")
        } footer: {
            Text("See how your accessibility settings affect the app interface")
        }
    }
}

// MARK: - Supporting Views

private struct SettingRow: View {
    let title: String
    let subtitle: String
    let isOn: Bool
    let isSystemSetting: Bool
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.body)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if isSystemSetting {
                Image(systemName: isOn ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isOn ? .green : .secondary)
                    .imageScale(.large)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture {
            if isSystemSetting {
                // Open iOS Settings
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(title), \(subtitle)")
        .accessibilityValue(isOn ? "Enabled" : "Disabled")
        .accessibilityHint(isSystemSetting ? "Tap to open iOS Settings" : nil)
    }
}

// MARK: - Sub-Settings Views

struct ColorBlindnessSettings: View {
    @AppStorage("colorBlindnessType") private var colorBlindnessType = ColorBlindnessType.none
    
    enum ColorBlindnessType: String, CaseIterable {
        case none = "None"
        case protanopia = "Protanopia (Red-Green)"
        case deuteranopia = "Deuteranopia (Red-Green)"
        case tritanopia = "Tritanopia (Blue-Yellow)"
        case monochromacy = "Monochromacy"
        
        var description: String {
            switch self {
            case .none: return "Normal color vision"
            case .protanopia: return "Difficulty seeing red colors"
            case .deuteranopia: return "Difficulty seeing green colors"
            case .tritanopia: return "Difficulty seeing blue colors"
            case .monochromacy: return "Complete color blindness"
            }
        }
    }
    
    var body: some View {
        Form {
            Section {
                ForEach(ColorBlindnessType.allCases, id: \.self) { type in
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(type.rawValue)
                                .font(.body)
                            Text(type.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        if colorBlindnessType == type {
                            Image(systemName: "checkmark")
                                .foregroundColor(.accentColor)
                        }
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        colorBlindnessType = type
                    }
                }
            } header: {
                Text("Color Vision Type")
            } footer: {
                Text("Adjusts color choices throughout the app for better visibility")
            }
            
            Section("Color Preview") {
                ColorPreviewGrid(colorBlindnessType: colorBlindnessType)
            }
        }
        .navigationTitle("Color Adjustments")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct ColorPreviewGrid: View {
    let colorBlindnessType: ColorBlindnessSettings.ColorBlindnessType
    
    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            ColorSample(label: "Protein", originalColor: .red, adjustedColor: adjustedColor(for: .red))
            ColorSample(label: "Carbs", originalColor: .blue, adjustedColor: adjustedColor(for: .blue))
            ColorSample(label: "Fat", originalColor: .green, adjustedColor: adjustedColor(for: .green))
            ColorSample(label: "Calories", originalColor: .orange, adjustedColor: adjustedColor(for: .orange))
            ColorSample(label: "Water", originalColor: .cyan, adjustedColor: adjustedColor(for: .cyan))
            ColorSample(label: "Exercise", originalColor: .purple, adjustedColor: adjustedColor(for: .purple))
        }
        .padding(.vertical)
    }
    
    private func adjustedColor(for color: Color) -> Color {
        // Simple color adjustment based on type
        switch colorBlindnessType {
        case .none:
            return color
        case .protanopia, .deuteranopia:
            // Adjust red/green colors
            if color == .red { return .orange }
            if color == .green { return .blue }
            return color
        case .tritanopia:
            // Adjust blue/yellow colors
            if color == .blue { return .purple }
            if color == .orange { return .red }
            return color
        case .monochromacy:
            // Convert to grayscale
            return .gray
        }
    }
}

struct ColorSample: View {
    let label: String
    let originalColor: Color
    let adjustedColor: Color
    
    var body: some View {
        VStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 8)
                .fill(adjustedColor)
                .frame(height: 40)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(label) color sample")
    }
}

struct SoundSettingsView: View {
    @AppStorage("soundEffects") private var soundEffects = true
    @AppStorage("successSound") private var successSound = "default"
    @AppStorage("errorSound") private var errorSound = "default"
    @AppStorage("scanSound") private var scanSound = "camera"
    
    var body: some View {
        Form {
            Section {
                Toggle("Sound Effects", isOn: $soundEffects)
            }
            
            if soundEffects {
                Section("Sound Types") {
                    SoundPicker(title: "Success", selection: $successSound)
                    SoundPicker(title: "Error", selection: $errorSound)
                    SoundPicker(title: "Scan", selection: $scanSound)
                }
            }
        }
        .navigationTitle("Sound Effects")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct SoundPicker: View {
    let title: String
    @Binding var selection: String
    
    let sounds = ["default", "chime", "bell", "pop", "click", "none"]
    
    var body: some View {
        Picker(title, selection: $selection) {
            ForEach(sounds, id: \.self) { sound in
                Text(sound.capitalized).tag(sound)
            }
        }
    }
}

struct GestureSettingsView: View {
    @AppStorage("tapTimeout") private var tapTimeout = 0.5
    @AppStorage("longPressTime") private var longPressTime = 0.5
    @AppStorage("doubleTapTime") private var doubleTapTime = 0.3
    @AppStorage("swipeDistance") private var swipeDistance = 50.0
    
    var body: some View {
        Form {
            Section("Touch Timing") {
                VStack(alignment: .leading) {
                    Text("Tap Timeout")
                    Slider(value: $tapTimeout, in: 0.1...2.0, step: 0.1)
                    Text("\(tapTimeout, specifier: "%.1f") seconds")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                VStack(alignment: .leading) {
                    Text("Long Press Duration")
                    Slider(value: $longPressTime, in: 0.2...3.0, step: 0.1)
                    Text("\(longPressTime, specifier: "%.1f") seconds")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                VStack(alignment: .leading) {
                    Text("Double Tap Speed")
                    Slider(value: $doubleTapTime, in: 0.1...1.0, step: 0.1)
                    Text("\(doubleTapTime, specifier: "%.1f") seconds")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Section("Swipe Sensitivity") {
                VStack(alignment: .leading) {
                    Text("Minimum Swipe Distance")
                    Slider(value: $swipeDistance, in: 20...200, step: 10)
                    Text("\(Int(swipeDistance)) points")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle("Touch Accommodations")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct KeyboardShortcutsView: View {
    let shortcuts = [
        KeyboardShortcut(key: "S", modifiers: [.command], action: "Scan food"),
        KeyboardShortcut(key: "M", modifiers: [.command], action: "Add meal"),
        KeyboardShortcut(key: "D", modifiers: [.command], action: "Dashboard"),
        KeyboardShortcut(key: "H", modifiers: [.command], action: "History"),
        KeyboardShortcut(key: "P", modifiers: [.command], action: "Profile"),
        KeyboardShortcut(key: ",", modifiers: [.command], action: "Settings"),
        KeyboardShortcut(key: "N", modifiers: [.command, .shift], action: "New goal"),
        KeyboardShortcut(key: "W", modifiers: [.command], action: "Log water"),
        KeyboardShortcut(key: "/", modifiers: [.command], action: "Search"),
        KeyboardShortcut(key: "?", modifiers: [.command, .shift], action: "Help")
    ]
    
    var body: some View {
        List {
            ForEach(shortcuts) { shortcut in
                HStack {
                    Text(shortcut.action)
                    Spacer()
                    ShortcutKeyView(shortcut: shortcut)
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel("\(shortcut.action), keyboard shortcut \(shortcut.description)")
            }
        }
        .navigationTitle("Keyboard Shortcuts")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct KeyboardShortcut: Identifiable {
    let id = UUID()
    let key: String
    let modifiers: [KeyModifier]
    let action: String
    
    enum KeyModifier {
        case command, shift, option, control
        
        var symbol: String {
            switch self {
            case .command: return "⌘"
            case .shift: return "⇧"
            case .option: return "⌥"
            case .control: return "⌃"
            }
        }
    }
    
    var description: String {
        let modifierString = modifiers.map(\.symbol).joined()
        return "\(modifierString)\(key)"
    }
}

struct ShortcutKeyView: View {
    let shortcut: KeyboardShortcut
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(shortcut.modifiers, id: \.self) { modifier in
                Text(modifier.symbol)
                    .font(.system(size: 14, weight: .medium, design: .monospaced))
                    .foregroundColor(.primary)
            }
            Text(shortcut.key)
                .font(.system(size: 14, weight: .medium, design: .monospaced))
                .foregroundColor(.primary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color(UIColor.tertiarySystemGroupedBackground))
        .cornerRadius(6)
    }
}

#Preview {
    AccessibilitySettingsView()
}
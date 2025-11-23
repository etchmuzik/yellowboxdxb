//
//  AccessibleComponents.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Accessible UI components with full internationalization support
//

import SwiftUI

// MARK: - Accessible Button

struct AccessibleButton<Label: View>: View {
    let action: () -> Void
    let label: () -> Label
    let hint: String?
    let role: ButtonRole?
    
    @StateObject private var accessibility = AccessibilityManager.shared
    @State private var isPressed = false
    
    init(
        action: @escaping () -> Void,
        hint: String? = nil,
        role: ButtonRole? = nil,
        @ViewBuilder label: @escaping () -> Label
    ) {
        self.action = action
        self.hint = hint
        self.role = role
        self.label = label
    }
    
    var body: some View {
        Button(action: {
            if accessibility.isVoiceOverEnabled {
                accessibility.playHaptic(.success)
            }
            action()
        }) {
            label()
                .scaleEffect(isPressed ? 0.95 : 1.0)
                .accessibleAnimation(.spring(response: 0.3, dampingFraction: 0.8))
        }
        .buttonStyle(PlainButtonStyle())
        .accessibilityHint(hint ?? "")
        .accessibilityAddTraits(role == .destructive ? .isButton : [])
        .accessibleTapTarget()
        .onLongPressGesture(
            minimumDuration: 0,
            maximumDistance: .infinity,
            pressing: { pressing in
                withAnimation(.easeInOut(duration: 0.1)) {
                    isPressed = pressing
                }
            },
            perform: {}
        )
    }
}

// MARK: - Accessible Text Field

struct AccessibleTextField: View {
    let title: String
    @Binding var text: String
    let placeholder: String
    let keyboardType: UIKeyboardType
    let textContentType: UITextContentType?
    let onCommit: (() -> Void)?
    
    @StateObject private var accessibility = AccessibilityManager.shared
    @FocusState private var isFocused: Bool
    
    init(
        _ title: String,
        text: Binding<String>,
        placeholder: String = "",
        keyboardType: UIKeyboardType = .default,
        textContentType: UITextContentType? = nil,
        onCommit: (() -> Void)? = nil
    ) {
        self.title = title
        self._text = text
        self.placeholder = placeholder
        self.keyboardType = keyboardType
        self.textContentType = textContentType
        self.onCommit = onCommit
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(accessibility.scaledFont(for: .caption))
                .foregroundColor(.secondary)
                .accessibilityHidden(true)
            
            TextField(placeholder, text: $text)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .keyboardType(keyboardType)
                .textContentType(textContentType)
                .focused($isFocused)
                .font(accessibility.scaledFont(for: .body))
                .accessibilityLabel(title)
                .accessibilityValue(text.isEmpty ? "Empty" : text)
                .accessibilityHint(placeholder)
                .onSubmit {
                    onCommit?()
                }
        }
    }
}

// MARK: - Accessible Progress Ring

struct AccessibleProgressRing: View {
    let progress: Double
    let goal: Double
    let label: String
    let color: Color
    let lineWidth: CGFloat
    
    @StateObject private var accessibility = AccessibilityManager.shared
    @State private var animatedProgress: Double = 0
    
    private var percentage: Int {
        goal > 0 ? Int((progress / goal) * 100) : 0
    }
    
    private var accessibilityDescription: String {
        let percent = min(percentage, 100)
        return "\(label): \(Int(progress)) of \(Int(goal)), \(percent)% complete"
    }
    
    var body: some View {
        ZStack {
            // Background ring
            Circle()
                .stroke(
                    accessibility.isIncreasedContrastEnabled ? 
                    Color.gray : color.opacity(0.2),
                    lineWidth: lineWidth
                )
            
            // Progress ring
            Circle()
                .trim(from: 0, to: min(animatedProgress, 1.0))
                .stroke(
                    accessibility.isIncreasedContrastEnabled ?
                    color.accessibleVariant : color,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .accessibleAnimation(.spring(response: 0.6, dampingFraction: 0.8))
            
            // Center content
            VStack(spacing: 4) {
                Text("\(percentage)%")
                    .font(accessibility.scaledFont(for: .title2, size: 24))
                    .fontWeight(.bold)
                    .foregroundColor(accessibility.isIncreasedContrastEnabled ? .primary : color)
                
                Text(label)
                    .font(accessibility.scaledFont(for: .caption))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
        }
        .onAppear {
            animatedProgress = progress / goal
        }
        .onChange(of: progress) { _, newValue in
            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                animatedProgress = newValue / goal
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
        .accessibilityValue(accessibilityDescription)
        .accessibilityAddTraits(.updatesFrequently)
    }
}

// MARK: - Accessible Meal Card

struct AccessibleMealCard: View {
    let meal: SimpleMeal
    let onTap: () -> Void
    let onDelete: (() -> Void)?
    
    @StateObject private var accessibility = AccessibilityManager.shared
    @StateObject private var localization = LocalizationManager.shared
    @AppStorage("useSimplifiedUI") private var useSimplifiedUI = false
    
    private var accessibilityDescription: String {
        let time = meal.timestamp.formatted(date: .omitted, time: .shortened)
        return "\(meal.name), \(meal.calories) calories, at \(time)"
    }
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: useSimplifiedUI ? 8 : 12) {
                // Header
                HStack {
                    Image(systemName: "fork.knife.circle.fill")
                        .font(accessibility.scaledFont(for: .title2))
                        .foregroundColor(.orange)
                        .accessibilityHidden(true)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(meal.name)
                            .font(accessibility.scaledFont(for: .headline))
                            .foregroundColor(.primary)
                            .lineLimit(1)
                        
                        Text(meal.timestamp.formatted(date: .omitted, time: .shortened))
                            .font(accessibility.scaledFont(for: .caption))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(meal.calories)")
                            .font(accessibility.scaledFont(for: .title3, size: 20))
                            .fontWeight(.bold)
                            .foregroundColor(.orange)
                        
                        Text(localization.currentLanguage == .english ? "cal" : localization.localizedString("calories_unit"))
                            .font(accessibility.scaledFont(for: .caption))
                            .foregroundColor(.orange.opacity(0.8))
                    }
                }
                
                if !useSimplifiedUI {
                    // Macros
                    HStack(spacing: 16) {
                        MacroLabel(
                            icon: "circle.fill",
                            value: meal.protein,
                            unit: "g",
                            color: .red,
                            label: localization.localizedString("protein")
                        )
                        
                        MacroLabel(
                            icon: "circle.fill",
                            value: meal.carbs,
                            unit: "g",
                            color: .blue,
                            label: localization.localizedString("carbs")
                        )
                        
                        MacroLabel(
                            icon: "circle.fill",
                            value: meal.fat,
                            unit: "g",
                            color: .green,
                            label: localization.localizedString("fat")
                        )
                    }
                    .font(accessibility.scaledFont(for: .caption))
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: useSimplifiedUI ? 8 : 12)
                    .fill(Color(UIColor.secondarySystemGroupedBackground))
                    .shadow(
                        color: .black.opacity(accessibility.isIncreasedContrastEnabled ? 0.2 : 0.05),
                        radius: accessibility.isIncreasedContrastEnabled ? 1 : 5,
                        y: 2
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(meal.name)
        .accessibilityValue(accessibilityDescription)
        .accessibilityHint("Double tap to view details")
        .accessibilityAddTraits(.isButton)
        .contextMenu {
            if let onDelete = onDelete {
                Button(role: .destructive, action: onDelete) {
                    Label("Delete", systemImage: "trash")
                }
            }
        }
    }
}

private struct MacroLabel: View {
    let icon: String
    let value: Double
    let unit: String
    let color: Color
    let label: String
    
    @StateObject private var accessibility = AccessibilityManager.shared
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 6))
                .foregroundColor(
                    accessibility.isIncreasedContrastEnabled ?
                    color.accessibleVariant : color
                )
            
            Text("\(Int(value))\(unit)")
                .foregroundColor(.secondary)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label): \(Int(value)) \(unit)")
    }
}

// MARK: - Accessible Tab Bar

struct AccessibleTabBar: View {
    @Binding var selection: Int
    let items: [TabItem]
    
    @StateObject private var accessibility = AccessibilityManager.shared
    @AppStorage("useSimplifiedUI") private var useSimplifiedUI = false
    
    struct TabItem {
        let id: Int
        let title: String
        let icon: String
        let accessibilityLabel: String
    }
    
    var body: some View {
        HStack(spacing: 0) {
            ForEach(items, id: \.id) { item in
                Button(action: {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                        selection = item.id
                    }
                    if accessibility.isVoiceOverEnabled {
                        accessibility.announce("\(item.title) tab selected")
                    }
                    accessibility.playImpactHaptic(.light)
                }) {
                    VStack(spacing: 4) {
                        Image(systemName: item.icon)
                            .font(.system(size: 24))
                            .symbolVariant(selection == item.id ? .fill : .none)
                        
                        if !useSimplifiedUI {
                            Text(item.title)
                                .font(accessibility.scaledFont(for: .caption2))
                        }
                    }
                    .foregroundColor(selection == item.id ? .accentColor : .secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(item.accessibilityLabel)
                .accessibilityAddTraits(selection == item.id ? [.isSelected] : [])
                .accessibilityHint("Double tap to select")
            }
        }
        .frame(height: useSimplifiedUI ? 60 : 80)
        .background(
            Color(UIColor.secondarySystemGroupedBackground)
                .shadow(
                    color: .black.opacity(0.1),
                    radius: accessibility.isIncreasedContrastEnabled ? 0 : 10,
                    y: -5
                )
        )
    }
}

// MARK: - Accessible Scanner View

struct AccessibleScannerView: View {
    @Binding var isPresented: Bool
    let onCapture: (UIImage) -> Void
    
    @StateObject private var accessibility = AccessibilityManager.shared
    @AppStorage("voiceGuidance") private var voiceGuidance = false
    @State private var hasAnnounced = false
    
    var body: some View {
        ZStack {
            // Camera view would go here
            Color.black
                .ignoresSafeArea()
            
            VStack {
                // Top bar
                HStack {
                    Button(action: {
                        isPresented = false
                    }) {
                        Image(systemName: "xmark")
                            .font(.title2)
                            .foregroundColor(.white)
                            .padding()
                            .background(Circle().fill(Color.black.opacity(0.5)))
                    }
                    .accessibilityLabel("Close camera")
                    .accessibilityHint("Double tap to close")
                    
                    Spacer()
                    
                    if voiceGuidance {
                        Button(action: {
                            provideVoiceGuidance()
                        }) {
                            Image(systemName: "speaker.wave.2")
                                .font(.title2)
                                .foregroundColor(.white)
                                .padding()
                                .background(Circle().fill(Color.black.opacity(0.5)))
                        }
                        .accessibilityLabel("Voice guidance")
                        .accessibilityHint("Double tap for scanning instructions")
                    }
                }
                .padding()
                
                Spacer()
                
                // Scanning frame
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color.white, lineWidth: 3)
                    .frame(width: 300, height: 300)
                    .overlay(
                        Text("Position food here")
                            .font(accessibility.scaledFont(for: .headline))
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.black.opacity(0.7))
                            .cornerRadius(8)
                            .offset(y: -170)
                    )
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Scanning area")
                    .accessibilityHint("Position food within the frame")
                
                Spacer()
                
                // Capture button
                Button(action: {
                    // Capture photo
                    accessibility.playHaptic(.success)
                    accessibility.announce("Photo captured")
                }) {
                    ZStack {
                        Circle()
                            .fill(Color.white)
                            .frame(width: 80, height: 80)
                        
                        Circle()
                            .stroke(Color.white, lineWidth: 4)
                            .frame(width: 90, height: 90)
                    }
                }
                .accessibilityLabel("Capture")
                .accessibilityHint("Double tap to take photo")
                .accessibleTapTarget(minSize: 100)
                .padding(.bottom, 40)
            }
        }
        .onAppear {
            if voiceGuidance && !hasAnnounced {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                    provideVoiceGuidance()
                    hasAnnounced = true
                }
            }
        }
    }
    
    private func provideVoiceGuidance() {
        let guidance = """
        Food scanner ready. Hold your device about 12 inches above the food. 
        Make sure the food is well-lit and centered in the frame. 
        Double tap the capture button at the bottom of the screen when ready.
        """
        accessibility.announce(guidance, priority: .high)
    }
}

// MARK: - Accessible Chart View

struct AccessibleChartView: View {
    let data: [ChartDataPoint]
    let chartType: ChartType
    let showGoal: Bool
    let goalValue: Double
    
    @StateObject private var accessibility = AccessibilityManager.shared
    @StateObject private var localization = LocalizationManager.shared
    
    struct ChartDataPoint: Identifiable {
        let id = UUID()
        let date: Date
        let value: Double
        let label: String
    }
    
    enum ChartType {
        case calories, protein, carbs, fat, water
        
        var color: Color {
            switch self {
            case .calories: return .orange
            case .protein: return .red
            case .carbs: return .blue
            case .fat: return .green
            case .water: return .cyan
            }
        }
        
        var accessibilityLabel: String {
            switch self {
            case .calories: return "Calories"
            case .protein: return "Protein"
            case .carbs: return "Carbohydrates"
            case .fat: return "Fat"
            case .water: return "Water"
            }
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Chart header
            HStack {
                Text(chartType.accessibilityLabel)
                    .font(accessibility.scaledFont(for: .headline))
                
                Spacer()
                
                if showGoal {
                    HStack(spacing: 4) {
                        Text("Goal:")
                            .font(accessibility.scaledFont(for: .caption))
                            .foregroundColor(.secondary)
                        Text(localization.formatCurrency(goalValue))
                            .font(accessibility.scaledFont(for: .caption))
                            .fontWeight(.medium)
                    }
                }
            }
            
            // Simplified chart for accessibility
            if accessibility.isVoiceOverEnabled || accessibility.preferredContentSize.isAccessibilityCategory {
                // List view for screen readers
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(data.suffix(7)) { point in
                        HStack {
                            Text(localization.formatDate(point.date, style: .short))
                                .font(accessibility.scaledFont(for: .caption))
                                .foregroundColor(.secondary)
                                .frame(width: 80, alignment: .leading)
                            
                            ProgressView(value: point.value, total: goalValue)
                                .progressViewStyle(LinearProgressViewStyle(tint: chartType.color))
                            
                            Text("\(Int(point.value))")
                                .font(accessibility.scaledFont(for: .caption))
                                .foregroundColor(.primary)
                                .frame(width: 50, alignment: .trailing)
                        }
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel("\(point.label): \(Int(point.value)) on \(localization.formatDate(point.date, style: .short))")
                    }
                }
            } else {
                // Regular chart view
                OptimizedChartView(
                    data: data.map { DailyNutritionData(
                        date: $0.date,
                        calories: Int($0.value),
                        protein: $0.value,
                        carbs: $0.value,
                        fat: $0.value,
                        waterIntake: $0.value
                    )},
                    chartType: chartType,
                    showGoals: showGoal,
                    goalValue: goalValue
                )
                .frame(height: 200)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(chartType.accessibilityLabel) chart")
        .accessibilityHint("Shows \(chartType.accessibilityLabel) data for the past week")
    }
}

// MARK: - Voice Input Button

struct VoiceInputButton: View {
    let action: () -> Void
    @State private var isRecording = false
    @StateObject private var accessibility = AccessibilityManager.shared
    
    var body: some View {
        Button(action: {
            isRecording.toggle()
            action()
            
            if isRecording {
                accessibility.announce("Recording started. Speak your command.")
            } else {
                accessibility.announce("Recording stopped.")
            }
        }) {
            ZStack {
                Circle()
                    .fill(isRecording ? Color.red : Color.blue)
                    .frame(width: 60, height: 60)
                
                Image(systemName: isRecording ? "stop.fill" : "mic.fill")
                    .font(.title2)
                    .foregroundColor(.white)
                    .accessibleAnimation(.easeInOut(duration: 0.2))
            }
        }
        .accessibilityLabel(isRecording ? "Stop recording" : "Start voice input")
        .accessibilityHint(isRecording ? "Double tap to stop" : "Double tap to start recording")
        .accessibilityAddTraits(.startsMediaSession)
        .shadow(radius: isRecording ? 10 : 5)
        .scaleEffect(isRecording ? 1.1 : 1.0)
        .accessibleAnimation(.spring(response: 0.3, dampingFraction: 0.8))
    }
}
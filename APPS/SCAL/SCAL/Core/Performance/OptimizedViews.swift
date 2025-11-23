//
//  OptimizedViews.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Performance-optimized view implementations for 120fps
//

import SwiftUI
import Charts

// MARK: - Optimized Chart View

struct OptimizedChartView: View {
    let data: [DailyNutritionData]
    let chartType: ChartType
    let showGoals: Bool
    let goalValue: Double
    
    @State private var renderedImage: UIImage?
    @State private var isGeneratingImage = false
    
    var body: some View {
        Group {
            if let image = renderedImage {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
            } else {
                // Fallback to regular chart while rendering
                regularChart
                    .onAppear {
                        renderChartToImage()
                    }
            }
        }
        .onChange(of: data) { _, _ in
            renderChartToImage()
        }
    }
    
    private var regularChart: some View {
        Chart {
            ForEach(data) { item in
                LineMark(
                    x: .value("Date", item.date),
                    y: .value("Value", getValue(for: item))
                )
                .foregroundStyle(chartType.color)
                .interpolationMethod(.catmullRom)
            }
            
            if showGoals {
                RuleMark(y: .value("Goal", goalValue))
                    .foregroundStyle(.orange)
                    .lineStyle(StrokeStyle(lineWidth: 2, dash: [5]))
            }
        }
        .frame(height: 200)
        .drawingGroup() // Flatten for performance
    }
    
    private func getValue(for item: DailyNutritionData) -> Double {
        switch chartType {
        case .calories: return Double(item.calories)
        case .protein: return item.protein
        case .carbs: return item.carbs
        case .fat: return item.fat
        case .water: return item.waterIntake
        }
    }
    
    private func renderChartToImage() {
        guard !isGeneratingImage else { return }
        isGeneratingImage = true
        
        Task {
            let renderer = ImageRenderer(content: regularChart)
            renderer.scale = UIScreen.main.scale
            
            if let uiImage = renderer.uiImage {
                await MainActor.run {
                    self.renderedImage = uiImage
                    self.isGeneratingImage = false
                }
            }
        }
    }
}

// MARK: - Optimized Meal List

struct OptimizedMealList: View {
    let meals: [SimpleMeal]
    let onDelete: (IndexSet) -> Void
    let onTap: (SimpleMeal) -> Void
    
    private let imageCache = ImageCacheManager.shared
    
    var body: some View {
        LazyVStack(spacing: 12) {
            ForEach(meals) { meal in
                OptimizedMealRow(meal: meal, onTap: onTap)
                    .transition(.asymmetric(
                        insertion: .push(from: .trailing).combined(with: .opacity),
                        removal: .push(from: .leading).combined(with: .opacity)
                    ))
            }
            .onDelete(perform: onDelete)
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: meals.count)
    }
}

struct OptimizedMealRow: View {
    let meal: SimpleMeal
    let onTap: (SimpleMeal) -> Void
    
    @State private var isPressed = false
    
    var body: some View {
        Button(action: { onTap(meal) }) {
            HStack(spacing: 12) {
                // Food icon with optimized rendering
                Image(systemName: "fork.knife.circle.fill")
                    .font(.title2)
                    .foregroundColor(SCALDesignSystem.Colors.primary)
                    .renderingOptimized()
                
                // Content
                VStack(alignment: .leading, spacing: 4) {
                    Text(meal.name)
                        .font(SCALDesignSystem.Typography.subheadlineBold)
                        .foregroundColor(SCALDesignSystem.Colors.primaryText)
                        .lineLimit(1)
                    
                    HStack(spacing: 8) {
                        MacroLabel(value: meal.calories, unit: "cal", color: SCALDesignSystem.Colors.calories)
                        MacroLabel(value: Int(meal.protein), unit: "g", color: SCALDesignSystem.Colors.protein)
                        MacroLabel(value: Int(meal.carbs), unit: "g", color: SCALDesignSystem.Colors.carbs)
                        MacroLabel(value: Int(meal.fat), unit: "g", color: SCALDesignSystem.Colors.fat)
                    }
                }
                
                Spacer()
                
                // Time
                Text(meal.timestamp.formatted(date: .omitted, time: .shortened))
                    .font(SCALDesignSystem.Typography.caption)
                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white)
                    .shadow(color: .black.opacity(isPressed ? 0.1 : 0.05), radius: isPressed ? 2 : 5, y: isPressed ? 1 : 2)
            )
            .scaleEffect(isPressed ? 0.98 : 1.0)
        }
        .buttonStyle(PlainButtonStyle())
        .onLongPressGesture(minimumDuration: 0, maximumDistance: .infinity,
                           pressing: { pressing in
            withAnimation(.easeInOut(duration: 0.1)) {
                isPressed = pressing
            }
        }, perform: {})
    }
}

struct MacroLabel: View {
    let value: Int
    let unit: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 2) {
            Text("\(value)")
                .font(SCALDesignSystem.Typography.caption2)
                .foregroundColor(color)
            Text(unit)
                .font(SCALDesignSystem.Typography.caption2)
                .foregroundColor(color.opacity(0.7))
        }
        .renderingOptimized()
    }
}

// MARK: - Optimized Progress Ring

struct OptimizedProgressRing: View {
    let progress: Double
    let color: Color
    let lineWidth: CGFloat
    
    @State private var animatedProgress: Double = 0
    
    var body: some View {
        ZStack {
            // Background ring
            Circle()
                .stroke(color.opacity(0.2), lineWidth: lineWidth)
            
            // Progress ring
            Circle()
                .trim(from: 0, to: animatedProgress)
                .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .drawingGroup() // Optimize rendering
        }
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                animatedProgress = progress
            }
        }
        .onChange(of: progress) { _, newValue in
            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                animatedProgress = newValue
            }
        }
    }
}

// MARK: - Optimized Animated Number

struct OptimizedAnimatedNumber: View {
    let value: Double
    let format: String
    let font: Font
    let color: Color
    
    @State private var displayValue: Double = 0
    private let animationDuration: Double = 0.5
    
    var body: some View {
        Text(String(format: format, displayValue))
            .font(font)
            .foregroundColor(color)
            .contentTransition(.numericText())
            .onAppear {
                withAnimation(.easeOut(duration: animationDuration)) {
                    displayValue = value
                }
            }
            .onChange(of: value) { oldValue, newValue in
                withAnimation(.easeOut(duration: animationDuration)) {
                    displayValue = newValue
                }
            }
    }
}

// MARK: - Optimized Grid Layout

struct OptimizedGrid<Item: Identifiable, Content: View>: View {
    let items: [Item]
    let columns: Int
    let spacing: CGFloat
    let content: (Item) -> Content
    
    private var gridColumns: [GridItem] {
        Array(repeating: GridItem(.flexible()), count: columns)
    }
    
    var body: some View {
        LazyVGrid(columns: gridColumns, spacing: spacing) {
            ForEach(items) { item in
                content(item)
                    .renderingOptimized()
            }
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.8), value: items.count)
    }
}

// MARK: - Optimized Tab View

struct OptimizedTabView<Content: View>: View {
    @Binding var selection: Int
    let content: Content
    
    init(selection: Binding<Int>, @ViewBuilder content: () -> Content) {
        self._selection = selection
        self.content = content()
    }
    
    var body: some View {
        TabView(selection: $selection) {
            content
        }
        .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
        .animation(.spring(response: 0.4, dampingFraction: 0.9), value: selection)
        .renderingOptimized()
    }
}

// MARK: - Optimized Async Image

struct OptimizedAsyncImage: View {
    let url: URL?
    let placeholder: AnyView
    
    @State private var image: UIImage?
    @State private var isLoading = false
    
    private let imageCache = ImageCacheManager.shared
    
    var body: some View {
        Group {
            if let image = image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .renderingOptimized()
            } else if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.gray.opacity(0.1))
            } else {
                placeholder
            }
        }
        .onAppear {
            loadImage()
        }
    }
    
    private func loadImage() {
        guard let url = url else { return }
        
        let key = url.absoluteString
        
        // Check cache first
        if let cachedImage = imageCache.image(for: key) {
            self.image = cachedImage
            return
        }
        
        // Load from network
        isLoading = true
        
        URLSession.shared.dataTask(with: url) { data, _, _ in
            if let data = data, let loadedImage = UIImage(data: data) {
                DispatchQueue.main.async {
                    // Store in cache
                    imageCache.store(loadedImage, for: key)
                    
                    // Update UI with animation
                    withAnimation(.easeIn(duration: 0.2)) {
                        self.image = loadedImage
                        self.isLoading = false
                    }
                }
            } else {
                DispatchQueue.main.async {
                    self.isLoading = false
                }
            }
        }.resume()
    }
}

// MARK: - Optimized Blur Effect

struct OptimizedBlur: UIViewRepresentable {
    let style: UIBlurEffect.Style
    let intensity: CGFloat
    
    func makeUIView(context: Context) -> UIVisualEffectView {
        let view = UIVisualEffectView(effect: UIBlurEffect(style: style))
        view.alpha = intensity
        return view
    }
    
    func updateUIView(_ uiView: UIVisualEffectView, context: Context) {
        uiView.alpha = intensity
    }
}

extension View {
    func optimizedBlur(style: UIBlurEffect.Style = .systemMaterial, intensity: CGFloat = 1.0) -> some View {
        self.background(OptimizedBlur(style: style, intensity: intensity))
    }
}

// MARK: - Haptic Feedback Manager

class HapticManager {
    static let shared = HapticManager()
    
    private let impactLight = UIImpactFeedbackGenerator(style: .light)
    private let impactMedium = UIImpactFeedbackGenerator(style: .medium)
    private let impactHeavy = UIImpactFeedbackGenerator(style: .heavy)
    private let selection = UISelectionFeedbackGenerator()
    private let notification = UINotificationFeedbackGenerator()
    
    init() {
        impactLight.prepare()
        impactMedium.prepare()
        impactHeavy.prepare()
        selection.prepare()
        notification.prepare()
    }
    
    func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
        switch style {
        case .light:
            impactLight.impactOccurred()
        case .medium:
            impactMedium.impactOccurred()
        case .heavy:
            impactHeavy.impactOccurred()
        default:
            break
        }
    }
    
    func selection() {
        selection.selectionChanged()
    }
    
    func notification(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        notification.notificationOccurred(type)
    }
}

// MARK: - View Extensions for Performance

extension View {
    func hapticFeedback(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .light) -> some View {
        self.onTapGesture {
            HapticManager.shared.impact(style)
        }
    }
    
    func lazyRendering() -> some View {
        self.drawingGroup()
            .compositingGroup()
    }
    
    func cachingGeometry() -> some View {
        self.modifier(CachingGeometryModifier())
    }
}

struct CachingGeometryModifier: ViewModifier {
    @State private var size: CGSize = .zero
    
    func body(content: Content) -> some View {
        content
            .background(
                GeometryReader { geometry in
                    Color.clear
                        .preference(key: SizePreferenceKey.self, value: geometry.size)
                }
            )
            .onPreferenceChange(SizePreferenceKey.self) { newSize in
                if size != newSize {
                    size = newSize
                }
            }
    }
}

struct SizePreferenceKey: PreferenceKey {
    static var defaultValue: CGSize = .zero
    static func reduce(value: inout CGSize, nextValue: () -> CGSize) {
        value = nextValue()
    }
}
//
//  MultiFoodResultsView.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Results and confirmation view for multi-food detection
//

import SwiftUI

struct MultiFoodResultsView: View {
    let composition: MealComposition
    let onConfirm: () -> Void
    let onRescan: () -> Void
    
    @State private var mealName = ""
    @State private var selectedMealType: MealComposition.MealType
    @State private var showingEditView = false
    @State private var editingItem: DetectedFoodItem?
    @State private var adjustedItems: [DetectedFoodItem]
    @State private var isSelectMode = false // NEW: Batch editing mode
    @State private var selectedItems: Set<UUID> = [] // NEW: Selected items for batch operations
    @State private var showingBatchEditSheet = false // NEW: Batch edit sheet

    @Environment(\.dismiss) private var dismiss
    
    init(composition: MealComposition, onConfirm: @escaping () -> Void, onRescan: @escaping () -> Void) {
        self.composition = composition
        self.onConfirm = onConfirm
        self.onRescan = onRescan
        self._selectedMealType = State(initialValue: composition.mealType)
        self._adjustedItems = State(initialValue: composition.items)
        self._mealName = State(initialValue: "\(composition.mealType.rawValue) - \(composition.items.count) items")
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    headerSection
                    
                    // Meal name input
                    mealNameSection
                    
                    // Total nutrition summary
                    nutritionSummarySection
                    
                    // Individual items
                    itemsSection
                    
                    // Meal type selector
                    mealTypeSection
                    
                    // Action buttons
                    actionButtonsSection
                }
                .padding()
            }
            .background(SCALDesignSystem.Colors.background)
            .navigationTitle("Confirm Meal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .foregroundColor(SCALDesignSystem.Colors.primary)
                }
            }
        }
        .sheet(item: $editingItem) { item in
            FoodItemEditView(
                item: item,
                onSave: { updatedItem in
                    updateItem(updatedItem)
                }
            )
        }
        .sheet(isPresented: $showingBatchEditSheet) {
            BatchEditView(
                items: adjustedItems.filter { selectedItems.contains($0.id) },
                onSave: { editedItems in
                    for item in editedItems {
                        updateItem(item)
                    }
                    isSelectMode = false
                    selectedItems.removeAll()
                }
            )
        }
    }
    
    // MARK: - Sections
    
    private var headerSection: some View {
        VStack(spacing: 12) {
            // Success icon
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)
                .symbolEffect(.bounce)
            
            // Title
            Text("Meal Analyzed!")
                .font(SCALDesignSystem.Typography.title2)
                .foregroundColor(SCALDesignSystem.Colors.primaryText)
            
            // Confidence score
            HStack {
                Image(systemName: "brain.head.profile")
                    .font(.caption)
                    .foregroundColor(SCALDesignSystem.Colors.primary)
                
                Text("AI Confidence: \(Int(composition.confidence * 100))%")
                    .font(SCALDesignSystem.Typography.caption)
                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            }
        }
    }
    
    private var mealNameSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Meal Name")
                .font(SCALDesignSystem.Typography.captionBold)
                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            
            TextField("Enter meal name", text: $mealName)
                .font(SCALDesignSystem.Typography.body)
                .foregroundColor(SCALDesignSystem.Colors.primaryText)
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(SCALDesignSystem.Colors.secondaryBackground)
                )
        }
    }
    
    private var nutritionSummarySection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Total Nutrition")
                    .font(SCALDesignSystem.Typography.headlineBold)
                    .foregroundColor(SCALDesignSystem.Colors.primaryText)
                
                Spacer()
                
                Text("\(adjustedItems.count) items")
                    .font(SCALDesignSystem.Typography.caption)
                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            }
            
            // Calorie display
            HStack {
                VStack(alignment: .leading) {
                    Text("Total Calories")
                        .font(SCALDesignSystem.Typography.caption)
                        .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                    
                    Text("\(totalCalories)")
                        .font(SCALDesignSystem.Typography.heroNumber)
                        .foregroundColor(SCALDesignSystem.Colors.calories)
                }
                
                Spacer()
                
                // Macro breakdown chart
                MacrosPieChart(
                    protein: totalProtein,
                    carbs: totalCarbs,
                    fat: totalFat,
                    size: 80
                )
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(SCALDesignSystem.Colors.calories.opacity(0.1))
            )
            
            // Macro details
            HStack(spacing: 20) {
                MacroDetailView(
                    title: "Protein",
                    value: totalProtein,
                    unit: "g",
                    color: SCALDesignSystem.Colors.protein
                )
                
                MacroDetailView(
                    title: "Carbs",
                    value: totalCarbs,
                    unit: "g",
                    color: SCALDesignSystem.Colors.carbs
                )
                
                MacroDetailView(
                    title: "Fat",
                    value: totalFat,
                    unit: "g",
                    color: SCALDesignSystem.Colors.fat
                )
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(SCALDesignSystem.Colors.secondaryBackground)
        )
    }
    
    private var itemsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Detected Items")
                    .font(SCALDesignSystem.Typography.subheadlineBold)
                    .foregroundColor(SCALDesignSystem.Colors.primaryText)

                Spacer()

                // Toggle select mode button
                Button(isSelectMode ? "Done" : "Select") {
                    withAnimation {
                        isSelectMode.toggle()
                        if !isSelectMode {
                            selectedItems.removeAll()
                        }
                    }
                }
                .font(SCALDesignSystem.Typography.caption)
                .foregroundColor(SCALDesignSystem.Colors.primary)
            }

            // Batch action bar (shown when items are selected)
            if isSelectMode && !selectedItems.isEmpty {
                HStack(spacing: 16) {
                    Text("\(selectedItems.count) selected")
                        .font(SCALDesignSystem.Typography.caption)
                        .foregroundColor(SCALDesignSystem.Colors.secondaryText)

                    Spacer()

                    Button(action: {
                        showingBatchEditSheet = true
                    }) {
                        Label("Edit", systemImage: "pencil")
                            .font(SCALDesignSystem.Typography.caption)
                    }

                    Button(action: deleteSelectedItems) {
                        Label("Delete", systemImage: "trash")
                            .font(SCALDesignSystem.Typography.caption)
                            .foregroundColor(.red)
                    }
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(SCALDesignSystem.Colors.primary.opacity(0.1))
                )
            }

            VStack(spacing: 8) {
                ForEach(adjustedItems) { item in
                    FoodItemRow(
                        item: item,
                        isSelectMode: isSelectMode,
                        isSelected: selectedItems.contains(item.id),
                        onEdit: {
                            if isSelectMode {
                                toggleItemSelection(item.id)
                            } else {
                                editingItem = item
                            }
                        }
                    )
                }
            }
        }
    }
    
    private var mealTypeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Meal Type")
                .font(SCALDesignSystem.Typography.captionBold)
                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            
            HStack(spacing: 8) {
                ForEach([MealComposition.MealType.breakfast, .lunch, .dinner, .snack], id: \.self) { type in
                    MealTypeButton(
                        type: type,
                        isSelected: selectedMealType == type
                    ) {
                        selectedMealType = type
                    }
                }
            }
        }
    }
    
    private var actionButtonsSection: some View {
        VStack(spacing: 12) {
            PrimaryActionButton(
                "Add to Food Log",
                icon: "checkmark.circle.fill"
            ) {
                onConfirm()
            }
            
            SecondaryActionButton(
                "Scan Again",
                icon: "arrow.clockwise",
                color: .gray
            ) {
                onRescan()
                dismiss()
            }
        }
    }
    
    // MARK: - Computed Properties
    
    private var totalCalories: Int {
        adjustedItems.reduce(0) { $0 + $1.calories }
    }
    
    private var totalProtein: Double {
        adjustedItems.reduce(0) { $0 + ($1.nutritionInfo?.protein ?? 0) }
    }
    
    private var totalCarbs: Double {
        adjustedItems.reduce(0) { $0 + ($1.nutritionInfo?.carbs ?? 0) }
    }
    
    private var totalFat: Double {
        adjustedItems.reduce(0) { $0 + ($1.nutritionInfo?.fat ?? 0) }
    }
    
    // MARK: - Helper Methods

    private func updateItem(_ updatedItem: DetectedFoodItem) {
        if let index = adjustedItems.firstIndex(where: { $0.id == updatedItem.id }) {
            adjustedItems[index] = updatedItem
        }
    }

    private func toggleItemSelection(_ id: UUID) {
        if selectedItems.contains(id) {
            selectedItems.remove(id)
        } else {
            selectedItems.insert(id)
        }
    }

    private func deleteSelectedItems() {
        adjustedItems.removeAll { selectedItems.contains($0.id) }
        selectedItems.removeAll()
        isSelectMode = false
    }
}

// MARK: - Supporting Views

struct FoodItemRow: View {
    let item: DetectedFoodItem
    var isSelectMode: Bool = false
    var isSelected: Bool = false
    let onEdit: () -> Void

    var body: some View {
        HStack {
            // Selection checkbox (only in select mode)
            if isSelectMode {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundColor(isSelected ? SCALDesignSystem.Colors.primary : SCALDesignSystem.Colors.secondaryText.opacity(0.5))
            }

            // Food icon
            Image(systemName: "fork.knife.circle.fill")
                .font(.title3)
                .foregroundColor(SCALDesignSystem.Colors.primary)

            // Food details
            VStack(alignment: .leading, spacing: 2) {
                Text(item.name)
                    .font(SCALDesignSystem.Typography.subheadline)
                    .foregroundColor(SCALDesignSystem.Colors.primaryText)

                Text("\(item.calories) cal • \(item.quantity)")
                    .font(SCALDesignSystem.Typography.caption)
                    .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            }

            Spacer()

            // Edit button (hide in select mode)
            if !isSelectMode {
                Button(action: onEdit) {
                    Image(systemName: "pencil.circle.fill")
                        .font(.title3)
                        .foregroundColor(SCALDesignSystem.Colors.primary.opacity(0.8))
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white)
                .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
        )
    }
}

struct MacroDetailView: View {
    let title: String
    let value: Double
    let unit: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(SCALDesignSystem.Typography.caption2)
                .foregroundColor(SCALDesignSystem.Colors.secondaryText)
            
            HStack(alignment: .bottom, spacing: 2) {
                Text(String(format: "%.1f", value))
                    .font(SCALDesignSystem.Typography.subheadlineBold)
                    .foregroundColor(color)
                
                Text(unit)
                    .font(SCALDesignSystem.Typography.caption2)
                    .foregroundColor(color.opacity(0.8))
            }
        }
        .frame(maxWidth: .infinity)
    }
}

struct MealTypeButton: View {
    let type: MealComposition.MealType
    let isSelected: Bool
    let action: () -> Void
    
    private var icon: String {
        switch type {
        case .breakfast: return "sun.max.fill"
        case .lunch: return "sun.min.fill"
        case .dinner: return "moon.fill"
        case .snack: return "star.fill"
        case .unknown: return "questionmark.circle.fill"
        }
    }
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.title3)
                
                Text(type.rawValue)
                    .font(SCALDesignSystem.Typography.caption2)
            }
            .foregroundColor(isSelected ? .white : SCALDesignSystem.Colors.primaryText)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? SCALDesignSystem.Colors.primary : SCALDesignSystem.Colors.secondaryBackground)
            )
        }
    }
}

// MARK: - Food Item Edit View

struct FoodItemEditView: View {
    let item: DetectedFoodItem
    let onSave: (DetectedFoodItem) -> Void
    
    @State private var name: String
    @State private var quantity: String
    @State private var calories: String
    @State private var protein: String
    @State private var carbs: String
    @State private var fat: String
    
    @Environment(\.dismiss) private var dismiss
    
    init(item: DetectedFoodItem, onSave: @escaping (DetectedFoodItem) -> Void) {
        self.item = item
        self.onSave = onSave
        self._name = State(initialValue: item.name)
        self._quantity = State(initialValue: item.quantity)
        self._calories = State(initialValue: "\(item.calories)")
        self._protein = State(initialValue: String(format: "%.1f", item.nutritionInfo?.protein ?? 0))
        self._carbs = State(initialValue: String(format: "%.1f", item.nutritionInfo?.carbs ?? 0))
        self._fat = State(initialValue: String(format: "%.1f", item.nutritionInfo?.fat ?? 0))
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section("Food Details") {
                    TextField("Name", text: $name)
                    TextField("Quantity", text: $quantity)
                }
                
                Section("Nutrition") {
                    HStack {
                        Text("Calories")
                        Spacer()
                        TextField("0", text: $calories)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                    }
                    
                    HStack {
                        Text("Protein (g)")
                        Spacer()
                        TextField("0", text: $protein)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                    }
                    
                    HStack {
                        Text("Carbs (g)")
                        Spacer()
                        TextField("0", text: $carbs)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                    }
                    
                    HStack {
                        Text("Fat (g)")
                        Spacer()
                        TextField("0", text: $fat)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                    }
                }
            }
            .navigationTitle("Edit Food")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveChanges()
                        dismiss()
                    }
                    .bold()
                }
            }
        }
    }
    
    private func saveChanges() {
        let updatedNutrition = NutritionInfo(
            calories: Int(calories) ?? item.calories,
            protein: Double(protein) ?? 0,
            carbs: Double(carbs) ?? 0,
            fat: Double(fat) ?? 0,
            serving: item.nutritionInfo?.serving ?? "1 serving"
        )
        
        let updatedItem = DetectedFoodItem(
            name: name,
            confidence: item.confidence,
            boundingBox: item.boundingBox,
            nutritionInfo: updatedNutrition,
            quantity: quantity,
            calories: Int(calories) ?? item.calories
        )
        
        onSave(updatedItem)
    }
}

// MARK: - Macros Pie Chart

struct MacrosPieChart: View {
    let protein: Double
    let carbs: Double
    let fat: Double
    let size: CGFloat
    
    private var total: Double {
        protein + carbs + fat
    }
    
    private var proteinAngle: Double {
        total > 0 ? (protein / total) * 360 : 0
    }
    
    private var carbsAngle: Double {
        total > 0 ? (carbs / total) * 360 : 0
    }
    
    private var fatAngle: Double {
        total > 0 ? (fat / total) * 360 : 0
    }
    
    var body: some View {
        ZStack {
            // Background circle
            Circle()
                .fill(SCALDesignSystem.Colors.secondaryBackground)
            
            // Protein segment
            PieSegment(
                startAngle: 0,
                endAngle: proteinAngle,
                color: SCALDesignSystem.Colors.protein
            )
            
            // Carbs segment
            PieSegment(
                startAngle: proteinAngle,
                endAngle: proteinAngle + carbsAngle,
                color: SCALDesignSystem.Colors.carbs
            )
            
            // Fat segment
            PieSegment(
                startAngle: proteinAngle + carbsAngle,
                endAngle: 360,
                color: SCALDesignSystem.Colors.fat
            )
            
            // Center hole
            Circle()
                .fill(SCALDesignSystem.Colors.background)
                .frame(width: size * 0.6, height: size * 0.6)
        }
        .frame(width: size, height: size)
    }
}

struct PieSegment: Shape {
    let startAngle: Double
    let endAngle: Double
    let color: Color
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let radius = min(rect.width, rect.height) / 2
        
        path.move(to: center)
        path.addArc(
            center: center,
            radius: radius,
            startAngle: Angle(degrees: startAngle - 90),
            endAngle: Angle(degrees: endAngle - 90),
            clockwise: false
        )
        path.closeSubpath()
        
        return path
    }
}

// MARK: - Batch Edit View

struct BatchEditView: View {
    let items: [DetectedFoodItem]
    let onSave: ([DetectedFoodItem]) -> Void

    @State private var editedItems: [DetectedFoodItem]
    @State private var portionMultiplier: Double = 1.0
    @Environment(\.dismiss) private var dismiss

    init(items: [DetectedFoodItem], onSave: @escaping ([DetectedFoodItem]) -> Void) {
        self.items = items
        self.onSave = onSave
        self._editedItems = State(initialValue: items)
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text("Batch Edit")
                        .font(SCALDesignSystem.Typography.title2)
                        .foregroundColor(SCALDesignSystem.Colors.primaryText)

                    Text("Editing \(items.count) item\(items.count == 1 ? "" : "s")")
                        .font(SCALDesignSystem.Typography.subheadline)
                        .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal)

                // Portion multiplier slider
                VStack(spacing: 12) {
                    HStack {
                        Text("Portion Size")
                            .font(SCALDesignSystem.Typography.subheadlineBold)
                            .foregroundColor(SCALDesignSystem.Colors.primaryText)

                        Spacer()

                        Text("\(Int(portionMultiplier * 100))%")
                            .font(SCALDesignSystem.Typography.bodyBold)
                            .foregroundColor(SCALDesignSystem.Colors.primary)
                    }

                    Slider(value: $portionMultiplier, in: 0.25...2.0, step: 0.25)
                        .accentColor(SCALDesignSystem.Colors.primary)
                        .onChange(of: portionMultiplier) { _, newValue in
                            applyPortionMultiplier(newValue)
                        }

                    HStack {
                        Text("25%")
                            .font(SCALDesignSystem.Typography.caption)
                            .foregroundColor(SCALDesignSystem.Colors.secondaryText)

                        Spacer()

                        Text("100%")
                            .font(SCALDesignSystem.Typography.caption)
                            .foregroundColor(SCALDesignSystem.Colors.secondaryText)

                        Spacer()

                        Text("200%")
                            .font(SCALDesignSystem.Typography.caption)
                            .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                    }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(SCALDesignSystem.Colors.cardBackground)
                )
                .padding(.horizontal)

                // Preview of changes
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(editedItems) { item in
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(item.name)
                                        .font(SCALDesignSystem.Typography.subheadlineBold)
                                        .foregroundColor(SCALDesignSystem.Colors.primaryText)

                                    Text("\(item.quantity)")
                                        .font(SCALDesignSystem.Typography.caption)
                                        .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                                }

                                Spacer()

                                VStack(alignment: .trailing, spacing: 4) {
                                    Text("\(item.calories) cal")
                                        .font(SCALDesignSystem.Typography.subheadlineBold)
                                        .foregroundColor(SCALDesignSystem.Colors.calories)

                                    if let nutrition = item.nutritionInfo {
                                        Text("P: \(String(format: "%.1f", nutrition.protein))g")
                                            .font(SCALDesignSystem.Typography.caption)
                                            .foregroundColor(SCALDesignSystem.Colors.secondaryText)
                                    }
                                }
                            }
                            .padding()
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.white)
                                    .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
                            )
                        }
                    }
                    .padding(.horizontal)
                }

                Spacer()

                // Action buttons
                VStack(spacing: 12) {
                    PrimaryActionButton(
                        "Apply Changes",
                        icon: "checkmark.circle.fill"
                    ) {
                        onSave(editedItems)
                        dismiss()
                    }

                    SecondaryActionButton(
                        "Cancel",
                        icon: "xmark.circle",
                        color: .gray
                    ) {
                        dismiss()
                    }
                }
                .padding()
            }
            .background(SCALDesignSystem.Colors.background)
        }
    }

    private func applyPortionMultiplier(_ multiplier: Double) {
        editedItems = items.map { item in
            var updatedItem = item
            updatedItem.calories = Int(Double(item.calories) * multiplier)

            if var nutrition = item.nutritionInfo {
                nutrition.protein *= multiplier
                nutrition.carbs *= multiplier
                nutrition.fat *= multiplier
                updatedItem.nutritionInfo = nutrition
            }

            // Update quantity description
            if multiplier < 1.0 {
                updatedItem.quantity = "Small portion"
            } else if multiplier > 1.0 {
                updatedItem.quantity = "Large portion"
            } else {
                updatedItem.quantity = "Medium portion"
            }

            return updatedItem
        }
    }
}

// MARK: - Preview

#if DEBUG
struct MultiFoodResultsView_Previews: PreviewProvider {
    static var previews: some View {
        MultiFoodResultsView(
            composition: MealComposition(
                items: [
                    DetectedFoodItem(
                        name: "Grilled Chicken",
                        confidence: 0.95,
                        boundingBox: .zero,
                        nutritionInfo: NutritionInfo(
                            calories: 165,
                            protein: 31,
                            carbs: 0,
                            fat: 3.6,
                            serving: "100g"
                        ),
                        quantity: "Medium portion",
                        calories: 165
                    ),
                    DetectedFoodItem(
                        name: "Brown Rice",
                        confidence: 0.88,
                        boundingBox: .zero,
                        nutritionInfo: NutritionInfo(
                            calories: 216,
                            protein: 5,
                            carbs: 45,
                            fat: 1.8,
                            serving: "1 cup"
                        ),
                        quantity: "Large portion",
                        calories: 216
                    )
                ],
                totalCalories: 381,
                totalProtein: 36,
                totalCarbs: 45,
                totalFat: 5.4,
                mealType: .dinner,
                confidence: 0.91
            ),
            onConfirm: {},
            onRescan: {}
        )
    }
}
#endif
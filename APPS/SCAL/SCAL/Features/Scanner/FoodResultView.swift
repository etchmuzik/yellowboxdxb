import SwiftUI

struct FoodResultView: View {
    let image: UIImage
    let results: [RecognizedFood]
    let onConfirm: ([Food]) -> Void
    let onCancel: () -> Void
    
    @State private var selectedFoods: [Food]
    @State private var showNutritionDetails = false
    @State private var editingFoodIndex: Int?
    
    init(image: UIImage, results: [RecognizedFood], onConfirm: @escaping ([Food]) -> Void, onCancel: @escaping () -> Void) {
        self.image = image
        self.results = results
        self.onConfirm = onConfirm
        self.onCancel = onCancel
        self._selectedFoods = State(initialValue: results.map { $0.food })
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Image preview
                imagePreview
                
                // Results list
                ScrollView {
                    VStack(spacing: 16) {
                        ForEach(Array(selectedFoods.enumerated()), id: \.element.id) { index, food in
                            FoodResultCard(
                                food: food,
                                confidence: results[safe: index]?.confidence ?? 0,
                                onEdit: {
                                    editingFoodIndex = index
                                },
                                onDelete: {
                                    selectedFoods.remove(at: index)
                                }
                            )
                        }
                        
                        // Add food button
                        addFoodButton
                    }
                    .padding()
                }
                
                // Bottom summary
                bottomSummary
            }
            .background(Color(UIColor.systemBackground))
            .navigationTitle("Food Detected")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        onCancel()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        onConfirm(selectedFoods)
                    }
                    .fontWeight(.semibold)
                    .disabled(selectedFoods.isEmpty)
                }
            }
        }
        .sheet(item: $editingFoodIndex) { index in
            if selectedFoods.indices.contains(index) {
                FoodEditView(food: $selectedFoods[index])
            }
        }
    }
    
    // MARK: - Components
    
    private var imagePreview: some View {
        Image(uiImage: image)
            .resizable()
            .aspectRatio(contentMode: .fill)
            .frame(height: 200)
            .clipped()
            .overlay(
                LinearGradient(
                    colors: [Color.clear, Color.black.opacity(0.3)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
    }
    
    @State private var showFoodSearch = false
    private var addFoodButton: some View {
        Button(action: {
            showFoodSearch = true
        }) {
            HStack {
                Image(systemName: "plus.circle.fill")
                    .font(.title2)
                Text("Add More Food")
                    .font(.headline)
            }
            .foregroundColor(.accentColor)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.accentColor.opacity(0.1))
            .cornerRadius(12)
        }
    }
    .sheet(isPresented: $showFoodSearch) {
        FoodSearchSheet { foundFood in
            if let food = foundFood {
                selectedFoods.append(food)
            }
            showFoodSearch = false
        }
    }
    
    private var bottomSummary: some View {
        VStack(spacing: 0) {
            Divider()
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Total Nutrition")
                        .font(.headline)
                    Text("\(selectedFoods.count) items")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                // Macro summary
                HStack(spacing: 20) {
                    MacroView(
                        value: totalCalories,
                        unit: "cal",
                        color: .orange
                    )
                    
                    MacroView(
                        value: totalProtein,
                        unit: "g",
                        label: "Protein",
                        color: .red
                    )
                    
                    MacroView(
                        value: totalCarbs,
                        unit: "g",
                        label: "Carbs",
                        color: .blue
                    )
                    
                    MacroView(
                        value: totalFat,
                        unit: "g",
                        label: "Fat",
                        color: .green
                    )
                }
            }
            .padding()
            .background(Color(UIColor.secondarySystemBackground))
        }
    }
    
    // MARK: - Computed Properties
    
    private var totalCalories: Int {
        selectedFoods.reduce(0) { $0 + Int($1.adjustedNutrition.calories) }
    }
    
    private var totalProtein: Double {
        selectedFoods.reduce(0) { $0 + $1.adjustedNutrition.protein }
    }
    
    private var totalCarbs: Double {
        selectedFoods.reduce(0) { $0 + $1.adjustedNutrition.carbohydrates }
    }
    
    private var totalFat: Double {
        selectedFoods.reduce(0) { $0 + $1.adjustedNutrition.fat }
    }
}

// MARK: - Food Result Card
struct FoodResultCard: View {
    let food: Food
    let confidence: Double
    let onEdit: () -> Void
    let onDelete: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(food.displayName)
                        .font(.headline)
                    
                    HStack(spacing: 8) {
                        // Confidence badge
                        ConfidenceBadge(confidence: confidence)
                        
                        // Data source
                        Text(food.dataSource.rawValue)
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.secondary.opacity(0.2))
                            .cornerRadius(4)
                    }
                }
                
                Spacer()
                
                // Actions
                HStack(spacing: 12) {
                    Button(action: onEdit) {
                        Image(systemName: "pencil")
                            .foregroundColor(.accentColor)
                    }
                    
                    Button(action: onDelete) {
                        Image(systemName: "trash")
                            .foregroundColor(.red)
                    }
                }
            }
            
            // Serving info
            HStack {
                Image(systemName: "scalemass")
                    .foregroundColor(.secondary)
                Text(food.servingSize.displayText)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                if food.customServingSize != 1.0 {
                    Text("× \(food.customServingSize, specifier: "%.1f")")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.accentColor)
                }
            }
            
            // Nutrition summary
            HStack(spacing: 16) {
                NutritionLabel(
                    value: Int(food.adjustedNutrition.calories),
                    unit: "cal",
                    color: .orange
                )
                
                NutritionLabel(
                    value: food.adjustedNutrition.protein,
                    unit: "g",
                    label: "Protein",
                    color: .red
                )
                
                NutritionLabel(
                    value: food.adjustedNutrition.carbohydrates,
                    unit: "g",
                    label: "Carbs",
                    color: .blue
                )
                
                NutritionLabel(
                    value: food.adjustedNutrition.fat,
                    unit: "g",
                    label: "Fat",
                    color: .green
                )
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(12)
    }
}

// MARK: - Supporting Views
struct ConfidenceBadge: View {
    let confidence: Double
    
    var color: Color {
        if confidence > 0.8 { return .green }
        else if confidence > 0.6 { return .orange }
        else { return .red }
    }
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "checkmark.seal.fill")
                .font(.caption)
            Text("\(Int(confidence * 100))%")
                .font(.caption)
                .fontWeight(.semibold)
        }
        .foregroundColor(color)
    }
}

struct NutritionLabel: View {
    let value: Double
    let unit: String
    var label: String? = nil
    let color: Color
    
    init(value: Double, unit: String, label: String? = nil, color: Color) {
        self.value = value
        self.unit = unit
        self.label = label
        self.color = color
    }
    
    init(value: Int, unit: String, label: String? = nil, color: Color) {
        self.value = Double(value)
        self.unit = unit
        self.label = label
        self.color = color
    }
    
    var body: some View {
        VStack(spacing: 2) {
            HStack(spacing: 2) {
                Text(value < 10 ? String(format: "%.1f", value) : "\(Int(value))")
                    .font(.headline)
                    .foregroundColor(color)
                Text(unit)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if let label = label {
                Text(label)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct MacroView: View {
    let value: Double
    let unit: String
    var label: String? = nil
    let color: Color
    
    init(value: Double, unit: String, label: String? = nil, color: Color) {
        self.value = value
        self.unit = unit
        self.label = label
        self.color = color
    }
    
    init(value: Int, unit: String, label: String? = nil, color: Color) {
        self.value = Double(value)
        self.unit = unit
        self.label = label
        self.color = color
    }
    
    var body: some View {
        VStack(spacing: 2) {
            Text(value < 10 ? String(format: "%.1f", value) : "\(Int(value))")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(label ?? unit)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Food Edit View (Placeholder)
struct FoodEditView: View {
    @Binding var food: Food
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                Section("Food Details") {
                    TextField("Name", text: $food.name)
                    
                    HStack {
                        Text("Serving Size")
                        Spacer()
                        Text("\(food.customServingSize, specifier: "%.1f") × \(food.servingSize.displayText)")
                            .foregroundColor(.secondary)
                    }
                }
                
                Section("Nutrition") {
                    HStack {
                        Text("Calories")
                        Spacer()
                        Text("\(Int(food.adjustedNutrition.calories))")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Edit Food")
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
}

// MARK: - Extensions
extension Collection {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

extension Binding where Value == Int? {
    func toNonOptional() -> Binding<Int> {
        Binding<Int>(
            get: { self.wrappedValue ?? 0 },
            set: { self.wrappedValue = $0 }
        )
    }
}

#Preview {
    FoodResultView(
        image: UIImage(systemName: "photo")!,
        results: [
            RecognizedFood(food: .sampleApple, confidence: 0.95, source: .mlKit)
        ],
        onConfirm: { _ in },
        onCancel: { }
    )
}

// Sheet for searching Core Data foods
struct FoodSearchSheet: View {
    @State private var searchText = ""
    @State private var results: [Food] = []
    let onSelect: (Food?) -> Void
    
    var body: some View {
        NavigationView {
            VStack {
                TextField("Search foods", text: $searchText, onEditingChanged: { _ in }, onCommit: searchFoods)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding()
                List(results, id: \ .id) { food in
                    Button(action: { onSelect(food) }) {
                        VStack(alignment: .leading) {
                            Text(food.displayName)
                                .font(.headline)
                            Text("\(Int(food.nutritionInfo.calories)) cal")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                Spacer()
            }
            .navigationTitle("Add Food")
            .navigationBarItems(trailing: Button("Cancel") { onSelect(nil) })
        }
        .onAppear {
            results = []
        }
    }
    
    private func searchFoods() {
        let fetch: NSFetchRequest<CDFood> = CDFood.fetchRequest()
        fetch.predicate = NSPredicate(format: "name CONTAINS[c] %@", searchText)
        fetch.fetchLimit = 20
        do {
            let found = try CoreDataStack.shared.viewContext.fetch(fetch)
            results = found.map { $0.toFood() }
        } catch {
            results = []
        }
    }
}

import SwiftUI

struct ManualMealEntrySheet: View {
    @State private var mealName = ""
    @State private var caloriesText = ""
    @State private var mealNotes = ""
    @State private var selectedMealType: MealType = .breakfast
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var localization = LocalizationManager.shared
    let onSave: (String, Double) -> Void
    
    private var canSave: Bool {
        guard !mealName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return false }
        return Double(caloriesText.replacingOccurrences(of: ",", with: ".")) != nil
    }
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text(localization.localized("Meal Details"))) {
                    TextField(localization.localized("Meal Name"), text: $mealName)
                    Picker(localization.localized("Meal Type"), selection: $selectedMealType) {
                        ForEach(MealType.allCases, id: \.self) { type in
                            Text(localization.localized(type.displayName)).tag(type)
                        }
                    }
                    TextField(localization.localized("Calories"), text: $caloriesText)
                        .keyboardType(.decimalPad)
                }
                
                Section(header: Text(localization.localized("Notes"))) {
                    TextEditor(text: $mealNotes)
                        .frame(minHeight: 120)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.calTextSecondary.opacity(0.3))
                        )
                        .listRowInsets(EdgeInsets())
                }
            }
            .navigationTitle(localization.localized("Quick Add"))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(localization.localized("Cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(localization.localized("Save")) {
                        if let calories = Double(caloriesText.replacingOccurrences(of: ",", with: ".")) {
                            onSave(mealName.trimmingCharacters(in: .whitespacesAndNewlines), calories)
                            dismiss()
                        }
                    }
                    .disabled(!canSave)
                }
            }
        }
    }
}

private enum MealType: String, CaseIterable {
    case breakfast
    case lunch
    case dinner
    case snack
    
    var displayName: String {
        switch self {
        case .breakfast: return "Breakfast"
        case .lunch: return "Lunch"
        case .dinner: return "Dinner"
        case .snack: return "Snack"
        }
    }
}

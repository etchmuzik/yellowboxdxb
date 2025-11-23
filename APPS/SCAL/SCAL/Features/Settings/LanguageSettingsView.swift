import SwiftUI

struct LanguageSettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var localization = LocalizationManager.shared
    
    var body: some View {
        NavigationView {
            List {
                Section(header: Text(localization.localized("Language"))) {
                    languageRow(for: .english)
                    languageRow(for: .arabic)
                }
                
                Section(header: Text(localization.localized("Preview"))) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(localization.localized("You're ready to start tracking"))
                            .font(.headline)
                        Text(localization.localized("Start by scanning your food!"))
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 6)
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle(localization.localized("Language"))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(localization.localized("Cancel")) { dismiss() }
                }
            }
        }
    }
    
    private func languageRow(for language: LocalizationManager.Language) -> some View {
        HStack {
            Text(language.displayName)
            Spacer()
            if localization.language == language {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.calPrimary)
            }
        }
        .contentShape(Rectangle())
        .onTapGesture {
            localization.language = language
        }
    }
}

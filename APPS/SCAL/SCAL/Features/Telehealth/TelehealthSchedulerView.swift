import SwiftUI

struct TelehealthSchedulerView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var viewModel = TelehealthSchedulerViewModel()
    @StateObject private var localization = LocalizationManager.shared
    
    var body: some View {
        NavigationView {
            Form {
                providerSection
                dateSection
                slotSection
                notesSection
                consentSection
                summarySection
            }
            .navigationTitle(localization.localized("Book Telehealth"))
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(localization.localized("Done")) { dismiss() }
                }
            }
        }
        .task {
            await viewModel.loadProviders()
        }
        .alert(localization.localized("Booking"), isPresented: $viewModel.bookingSuccess) {
            Button("OK") { dismiss() }
        } message: {
            Text(localization.localized("Your consultation is confirmed."))
        }
        .alert(localization.localized("Telehealth"), isPresented: errorBinding) {
            Button("OK") {}
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
    }
    
    private var providerSection: some View {
        Section(header: Text(localization.localized("Provider"))) {
            Picker(localization.localized("Choose a specialist"), selection: $viewModel.selectedProvider) {
                ForEach(viewModel.providers) { provider in
                    Text("\(provider.name) – \(provider.specialty)").tag(Optional(provider))
                }
            }
        }
    }
    
    private var dateSection: some View {
        Section(header: Text(localization.localized("Date"))) {
            DatePicker(localization.localized("Select a date"), selection: $viewModel.selectedDate, displayedComponents: .date)
                .onChange(of: viewModel.selectedDate) { _, _ in
                    Task { await viewModel.loadSlots() }
                }
        }
    }
    
    private var slotSection: some View {
        Section(header: Text(localization.localized("Timeslots"))) {
            if viewModel.timeslots.isEmpty {
                Text(localization.localized("No slots available"))
                    .foregroundColor(.secondary)
            } else {
                ForEach(viewModel.timeslots) { slot in
                    Button {
                        viewModel.selectedSlot = slot
                    } label: {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(timeRange(slot))
                                Text(slot.isVirtual ? localization.localized("Virtual consultation") : localization.localized("In-person"))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            if viewModel.selectedSlot == slot {
                                Image(systemName: "checkmark.circle.fill").foregroundColor(.calPrimary)
                            }
                        }
                    }
                }
            }
        }
    }
    
    private var notesSection: some View {
        Section(header: Text(localization.localized("Notes"))) {
            TextEditor(text: $viewModel.notes)
                .frame(minHeight: 80)
        }
    }
    
    private var consentSection: some View {
        Section(header: Text(localization.localized("Consent")), footer: Text(localization.localized("Consent footer"))) {
            Toggle(isOn: $viewModel.consentAccepted) {
                Text(localization.localized("I understand Dubai's telehealth regulations and consent to share my data."))
            }
        }
    }
    
    private var summarySection: some View {
        Section {
            Button {
                Task { await viewModel.book() }
            } label: {
                if viewModel.isBooking {
                    ProgressView()
                } else {
                    Text(localization.localized("Confirm Consultation"))
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
            }
            .disabled(viewModel.selectedSlot == nil)
        }
    }
    
    private func timeRange(_ slot: TelehealthTimeslot) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return "\(formatter.string(from: slot.start)) – \(formatter.string(from: slot.end))"
    }
    
    private var errorBinding: Binding<Bool> {
        Binding(
            get: { viewModel.errorMessage != nil },
            set: { newValue in
                if !newValue {
                    viewModel.errorMessage = nil
                }
            }
        )
    }
}

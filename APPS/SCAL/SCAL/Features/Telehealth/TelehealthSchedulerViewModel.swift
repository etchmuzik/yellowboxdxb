import Foundation
import Combine

@MainActor
final class TelehealthSchedulerViewModel: ObservableObject {
    @Published var providers: [TelehealthProvider] = []
    @Published var selectedProvider: TelehealthProvider?
    @Published var selectedDate = Date()
    @Published var timeslots: [TelehealthTimeslot] = []
    @Published var selectedSlot: TelehealthTimeslot?
    @Published var notes: String = ""
    @Published var consentAccepted = false
    @Published var isBooking = false
    @Published var bookingSuccess = false
    @Published var errorMessage: String?
    
    private let service: SupabaseTelehealthService
    
    init(service: SupabaseTelehealthService = .shared) {
        self.service = service
    }
    
    func loadProviders() async {
        providers = await service.fetchProviders()
        if selectedProvider == nil {
            selectedProvider = providers.first
        }
        await loadSlots()
    }
    
    func loadSlots() async {
        guard let provider = selectedProvider else { return }
        timeslots = await service.fetchTimeslots(for: provider.id, on: selectedDate)
        selectedSlot = nil
    }
    
    func book() async {
        guard let provider = selectedProvider, let slot = selectedSlot else {
            errorMessage = "Please select a provider and time slot"
            return
        }
        guard consentAccepted else {
            errorMessage = "Telehealth consent is required"
            return
        }
        errorMessage = nil
        isBooking = true
        defer { isBooking = false }
        let request = TelehealthAppointmentRequest(providerId: provider.id, start: slot.start, end: slot.end, notes: notes, consentAccepted: consentAccepted)
        do {
            try await service.bookAppointment(request)
            bookingSuccess = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

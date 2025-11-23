import Foundation

@MainActor
final class EventBookingViewModel: ObservableObject {
    @Published var events: [CommunityEvent] = []
    @Published var selectedFilter: CommunityEventType? = nil
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let service: SupabaseCommunityService
    
    init(service: SupabaseCommunityService = .shared) {
        self.service = service
    }
    
    var filteredEvents: [CommunityEvent] {
        guard let filter = selectedFilter else { return events }
        return events.filter { $0.type == filter }
    }
    
    func loadEvents() async {
        isLoading = true
        defer { isLoading = false }
        events = await service.fetchEvents()
    }
}

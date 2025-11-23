import Foundation

@MainActor
final class LoyaltyDashboardViewModel: ObservableObject {
    @Published var partners: [LoyaltyPartner] = []
    @Published var account: LoyaltyAccount?
    @Published var transactions: [LoyaltyTransaction] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let service: SupabaseLoyaltyService
    
    init(service: SupabaseLoyaltyService = .shared) {
        self.service = service
    }
    
    func loadData() async {
        isLoading = true
        defer { isLoading = false }
        partners = await service.fetchPartners()
        account = await service.fetchAccount()
        transactions = await service.fetchTransactions()
    }
}

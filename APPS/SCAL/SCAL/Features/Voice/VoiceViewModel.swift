//
//  VoiceViewModel.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Voice input view model for speech recognition and food logging
//

import SwiftUI
import Speech
import Combine

@MainActor
class VoiceViewModel: ObservableObject {
    @Published var isListening = false
    @Published var recognizedText = ""
    @Published var processedFoodText = ""
    @Published var searchResults: [SimpleFood] = []
    @Published var selectedFood: SimpleFood?
    @Published var showingFoodConfirmation = false
    @Published var customQuantity = "1"
    @Published var isProcessing = false
    @Published var errorMessage: String?
    
    // Voice feedback
    @Published var feedbackMessage = ""
    @Published var showingFeedback = false
    
    // Dependencies
    private let voiceRecognition = VoiceRecognitionManager.shared
    private let foodSearch = SimpleFoodSearchService.shared
    private let mealData: MealDataManager
    private var cancellables = Set<AnyCancellable>()
    
    init(mealDataManager: MealDataManager) {
        self.mealData = mealDataManager
        setupBindings()
        setupNotifications()
    }
    
    private func setupBindings() {
        // Observe voice recognition state
        voiceRecognition.objectWillChange
            .receive(on: DispatchQueue.main)
            .sink { [weak self] in
                self?.isListening = self?.voiceRecognition.isRecording ?? false
                self?.recognizedText = self?.voiceRecognition.recognizedText ?? ""
                self?.errorMessage = self?.voiceRecognition.errorMessage
            }
            .store(in: &cancellables)
        
        // Observe food search results
        foodSearch.objectWillChange
            .receive(on: DispatchQueue.main)
            .sink { [weak self] in
                self?.searchResults = self?.foodSearch.searchResults ?? []
                self?.isProcessing = self?.foodSearch.isSearching ?? false
            }
            .store(in: &cancellables)
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            forName: NSNotification.Name("VoiceRecognitionCompleted"),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            if let foodText = notification.userInfo?["foodText"] as? String,
               let originalText = notification.userInfo?["originalText"] as? String {
                self?.processedFoodText = foodText
                self?.searchForFood(foodText)
            }
        }
    }
    
    // MARK: - Voice Recognition Actions
    
    func startListening() {
        guard voiceRecognition.isAuthorized else {
            errorMessage = "Speech recognition not authorized"
            return
        }
        
        do {
            try voiceRecognition.startRecording()
            recognizedText = ""
            processedFoodText = ""
            searchResults = []
            provideFeedback("Listening for food...", type: .info)
        } catch {
            errorMessage = "Failed to start recording: \(error.localizedDescription)"
        }
    }
    
    func stopListening() {
        voiceRecognition.stopRecording()
        if !processedFoodText.isEmpty {
            provideFeedback("Processing: \(processedFoodText)", type: .processing)
        }
    }
    
    // MARK: - Food Search and Processing
    
    private func searchForFood(_ foodText: String) {
        guard !foodText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            provideFeedback("No food detected. Please try again.", type: .error)
            return
        }
        
        isProcessing = true
        
        Task {
            await foodSearch.searchFood(query: foodText)
            
            DispatchQueue.main.async {
                if self.searchResults.isEmpty {
                    self.provideFeedback("No matches found for '\(foodText)'. Try being more specific.", type: .warning)
                } else {
                    let topResult = self.searchResults[0]
                    self.selectFood(topResult)
                    self.provideFeedback("Found: \(topResult.name)", type: .success)
                }
            }
        }
    }
    
    func selectFood(_ food: SimpleFood) {
        selectedFood = food
        showingFoodConfirmation = true
    }
    
    func confirmFoodSelection() {
        guard let food = selectedFood else { return }
        
        let quantity = Double(customQuantity) ?? 1.0
        let adjustedCalories = Int(Double(food.calories) * quantity)
        let adjustedProtein = food.protein * quantity
        let adjustedCarbs = food.carbs * quantity
        let adjustedFat = food.fat * quantity
        
        mealData.addMeal(
            name: food.name,
            calories: adjustedCalories,
            protein: adjustedProtein,
            carbs: adjustedCarbs,
            fat: adjustedFat,
            source: "Voice Input"
        )
        
        provideFeedback("Logged \(food.name) - \(adjustedCalories) calories!", type: .success)
        
        // Reset state
        resetInputState()
    }
    
    func cancelFoodSelection() {
        selectedFood = nil
        showingFoodConfirmation = false
        customQuantity = "1"
        provideFeedback("Food logging cancelled", type: .info)
    }
    
    // MARK: - Quick Voice Commands
    
    func handleQuickCommand(_ command: String) {
        let lowercasedCommand = command.lowercased()
        
        // Check for quick commands
        if lowercasedCommand.contains("water") {
            handleWaterCommand(lowercasedCommand)
        } else if lowercasedCommand.contains("weight") {
            handleWeightCommand(lowercasedCommand)
        } else if lowercasedCommand.contains("summary") || lowercasedCommand.contains("total") {
            provideSummary()
        } else {
            // Regular food search
            searchForFood(command)
        }
    }
    
    private func handleWaterCommand(_ command: String) {
        // Extract water amount from command
        let words = command.components(separatedBy: .whitespacesAndNewlines)
        
        for (index, word) in words.enumerated() {
            if let amount = Double(word) {
                // Found a number, assume it's liters
                Task {
                    await HealthKitManager.shared.saveWaterIntake(liters: amount)
                    DispatchQueue.main.async {
                        self.provideFeedback("Logged \(amount)L of water!", type: .success)
                    }
                }
                return
            }
        }
        
        // Default to 250ml (0.25L) if no amount specified
        Task {
            await HealthKitManager.shared.saveWaterIntake(liters: 0.25)
            DispatchQueue.main.async {
                self.provideFeedback("Logged 250ml of water!", type: .success)
            }
        }
    }
    
    private func handleWeightCommand(_ command: String) {
        // For now, just provide current weight info
        if let weight = HealthKitManager.shared.latestWeight {
            provideFeedback("Your latest weight: \(String(format: "%.1f", weight))kg", type: .info)
        } else {
            provideFeedback("No weight data available. Please update in Health app.", type: .warning)
        }
    }
    
    private func provideSummary() {
        let totalCalories = mealData.totalCalories
        let mealCount = mealData.todaysMeals.count
        
        let summary = "Today: \(mealCount) meals, \(totalCalories) calories"
        provideFeedback(summary, type: .info)
    }
    
    // MARK: - Feedback System
    
    private func provideFeedback(_ message: String, type: FeedbackType) {
        feedbackMessage = message
        showingFeedback = true
        
        // Auto-dismiss after 3 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            self.showingFeedback = false
        }
    }
    
    // MARK: - State Management
    
    private func resetInputState() {
        selectedFood = nil
        showingFoodConfirmation = false
        customQuantity = "1"
        recognizedText = ""
        processedFoodText = ""
        searchResults = []
        isProcessing = false
    }
    
    func clearAll() {
        resetInputState()
        errorMessage = nil
        showingFeedback = false
    }
    
    // MARK: - Getters
    
    func getVoiceRecognitionManager() -> VoiceRecognitionManager {
        return voiceRecognition
    }
    
    func getFoodSearchService() -> SimpleFoodSearchService {
        return foodSearch
    }
}

// MARK: - Helper Enums

enum FeedbackType {
    case success, error, warning, info, processing
    
    var color: Color {
        switch self {
        case .success: return .green
        case .error: return .red
        case .warning: return .orange
        case .info: return .blue
        case .processing: return .purple
        }
    }
}
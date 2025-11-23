import SwiftUI
import Speech
import AVFoundation
import Alamofire

struct VoiceInputView: View {
    @StateObject private var voiceRecognizer = VoiceRecognizer()
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @EnvironmentObject var dataManager: MealDataManager
    @StateObject private var foodSearchService = SimpleFoodSearchService()
    @State private var isRecording = false
    @State private var recognizedText = ""
    @State private var showingResult = false
    @State private var detectedFood: SimpleFood?
    @State private var isSearchingFood = false
    @State private var searchError = false
    
    var body: some View {
        if subscriptionManager.hasAccess(to: .voiceLogging) {
            VStack(spacing: 30) {
                // Status indicator
                statusSection
                
                // Voice visualization
                voiceVisualization
                
                // Record button
                recordButton
                
                // Recognized text
                if !recognizedText.isEmpty {
                    recognizedTextSection
                }
                
                // Loading indicator
                if isSearchingFood {
                    ProgressView("Searching for nutrition info...")
                        .padding()
                }
                
                // Quick phrases
                quickPhrasesSection
            }
        } else {
            // Premium content wrapper
            PremiumContentWrapper(
                requiredTier: .premium,
                feature: .voiceLogging
            ) {
                EmptyView()
            }
        }
        .padding()
        .navigationTitle("Voice Log")
        .navigationBarTitleDisplayMode(.large)
        .onAppear {
            voiceRecognizer.requestPermission()
        }
        .alert("Meal Logged!", isPresented: $showingResult) {
            Button("OK") {
                recognizedText = ""
            }
        } message: {
            if let food = detectedFood {
                Text("\(food.name) (\(Int(food.calories)) calories) has been added to your log")
            }
        }
        .alert("No food found", isPresented: $searchError) {
            Button("OK") { }
        } message: {
            Text("Could not find nutrition information for '\(recognizedText)'. Try being more specific.")
        }
    }
    
    // MARK: - Components
    
    private var statusSection: some View {
        HStack {
            Circle()
                .fill(voiceRecognizer.isAuthorized ? Color.green : Color.red)
                .frame(width: 12, height: 12)
            
            Text(voiceRecognizer.isAuthorized ? "Voice ready" : "Microphone access required")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Spacer()
        }
        .padding(.horizontal)
    }
    
    private var voiceVisualization: some View {
        ZStack {
            // Background circle
            Circle()
                .fill(Color.accentColor.opacity(0.1))
                .frame(width: 200, height: 200)
            
            // Animated rings
            if isRecording {
                ForEach(0..<3) { index in
                    Circle()
                        .stroke(Color.accentColor.opacity(0.3), lineWidth: 2)
                        .frame(width: 200 + CGFloat(index * 40), height: 200 + CGFloat(index * 40))
                        .scaleEffect(isRecording ? 1.2 : 1.0)
                        .opacity(isRecording ? 0 : 1)
                        .animation(
                            Animation.easeOut(duration: 1.5)
                                .repeatForever(autoreverses: false)
                                .delay(Double(index) * 0.5),
                            value: isRecording
                        )
                }
            }
            
            // Microphone icon
            Image(systemName: isRecording ? "mic.fill" : "mic")
                .font(.system(size: 60))
                .foregroundColor(isRecording ? .red : .accentColor)
                .scaleEffect(isRecording ? 1.1 : 1.0)
                .animation(.easeInOut(duration: 0.3), value: isRecording)
        }
    }
    
    private var recordButton: some View {
        Button(action: toggleRecording) {
            Text(isRecording ? "Stop Recording" : "Tap to Speak")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(isRecording ? Color.red : Color.accentColor)
                .cornerRadius(12)
        }
        .disabled(!voiceRecognizer.isAuthorized)
    }
    
    private var recognizedTextSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("You said:")
                .font(.headline)
            
            Text(recognizedText)
                .font(.body)
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(UIColor.secondarySystemGroupedBackground))
                .cornerRadius(12)
            
            Button(action: processRecognizedText) {
                Label("Log This Meal", systemImage: "plus.circle.fill")
                    .font(.subheadline)
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(.horizontal)
    }
    
    private var quickPhrasesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Try saying:")
                .font(.headline)
                .padding(.horizontal)
            
            VStack(spacing: 8) {
                QuickPhraseRow(phrase: "I had a chicken salad for lunch")
                QuickPhraseRow(phrase: "Just ate an apple and yogurt")
                QuickPhraseRow(phrase: "Coffee with milk, no sugar")
                QuickPhraseRow(phrase: "Large pizza slice")
            }
        }
        .padding(.top)
    }
    
    // MARK: - Actions
    
    private func toggleRecording() {
        if isRecording {
            stopRecording()
        } else {
            startRecording()
        }
    }
    
    private func startRecording() {
        recognizedText = ""
        isRecording = true
        
        voiceRecognizer.startRecording { result in
            recognizedText = result
        }
        
        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }
    
    private func stopRecording() {
        isRecording = false
        voiceRecognizer.stopRecording()
        
        if !recognizedText.isEmpty {
            processRecognizedText()
        }
    }
    
    private func processRecognizedText() {
        // Extract food items from recognized text
        let foodQuery = extractFoodFromSpeech(recognizedText)
        
        // Show loading state
        isSearchingFood = true
        
        Task {
            // Search USDA for real nutrition data
            await foodSearchService.searchFood(query: foodQuery)
            
            await MainActor.run {
                isSearchingFood = false
                
                if let firstResult = foodSearchService.searchResults.first {
                    // Use the first USDA result
                    detectedFood = firstResult
                    
                    // Add to meal log with real nutrition data
                    dataManager.addMeal(
                        name: firstResult.name,
                        calories: Int(firstResult.calories),
                        protein: Int(firstResult.protein),
                        carbs: Int(firstResult.carbs),
                        fat: Int(firstResult.fat)
                    )
                    
                    showingResult = true
                } else {
                    // No results found
                    searchError = true
                }
            }
        }
    }
    
    private func extractFoodFromSpeech(_ text: String) -> String {
        // Extract food-related keywords from speech
        let lowercased = text.lowercased()
        
        // Common food indicators to remove
        let indicators = ["i had", "i ate", "just ate", "eating", "for breakfast", "for lunch", "for dinner", "for snack"]
        var cleaned = lowercased
        
        for indicator in indicators {
            cleaned = cleaned.replacingOccurrences(of: indicator, with: "")
        }
        
        // Remove articles and common words
        let commonWords = ["a", "an", "the", "some", "of", "with", "and"]
        let words = cleaned.split(separator: " ")
        let filteredWords = words.filter { !commonWords.contains(String($0)) }
        
        let foodQuery = filteredWords.joined(separator: " ").trimmingCharacters(in: .whitespacesAndNewlines)
        
        // If we couldn't extract anything meaningful, use the original text
        return foodQuery.isEmpty ? text : foodQuery
    }
}

// MARK: - Voice Recognizer
class VoiceRecognizer: ObservableObject {
    @Published var isAuthorized = false
    
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    
    func requestPermission() {
        SFSpeechRecognizer.requestAuthorization { authStatus in
            DispatchQueue.main.async {
                switch authStatus {
                case .authorized:
                    self.isAuthorized = true
                case .denied, .restricted, .notDetermined:
                    self.isAuthorized = false
                @unknown default:
                    self.isAuthorized = false
                }
            }
        }
    }
    
    func startRecording(completion: @escaping (String) -> Void) {
        // Cancel any ongoing task
        if recognitionTask != nil {
            recognitionTask?.cancel()
            recognitionTask = nil
        }
        
        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            print("Audio session setup failed: \(error)")
            return
        }
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        
        let inputNode = audioEngine.inputNode
        guard let recognitionRequest = recognitionRequest else { return }
        
        recognitionRequest.shouldReportPartialResults = true
        
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { result, error in
            var isFinal = false
            
            if let result = result {
                completion(result.bestTranscription.formattedString)
                isFinal = result.isFinal
            }
            
            if error != nil || isFinal {
                self.audioEngine.stop()
                inputNode.removeTap(onBus: 0)
                
                self.recognitionRequest = nil
                self.recognitionTask = nil
            }
        }
        
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            self.recognitionRequest?.append(buffer)
        }
        
        audioEngine.prepare()
        
        do {
            try audioEngine.start()
        } catch {
            print("Audio engine couldn't start: \(error)")
        }
    }
    
    func stopRecording() {
        audioEngine.stop()
        recognitionRequest?.endAudio()
    }
}

// MARK: - Supporting Views
struct QuickPhraseRow: View {
    let phrase: String
    
    var body: some View {
        HStack {
            Image(systemName: "quote.bubble")
                .font(.caption)
                .foregroundColor(.secondary)
            
            Text(phrase)
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationView {
        VoiceInputView()
            .environmentObject(MealDataManager())
    }
}
//
//  VoiceRecognitionManager.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Voice recognition and speech processing manager
//

import Speech
import SwiftUI
import AVFoundation

@MainActor
class VoiceRecognitionManager: ObservableObject {
    static let shared = VoiceRecognitionManager()
    
    @Published var isRecording = false
    @Published var recognizedText = ""
    @Published var isAuthorized = false
    @Published var errorMessage: String?
    
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    
    init() {
        requestAuthorization()
        setupMultilingualRecognizer()
    }
    
    private func setupMultilingualRecognizer() {
        // Try to set up Arabic recognizer as well
        if let arabicRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "ar-AE")) {
            // Store for potential future use
            print("Arabic recognizer available")
        }
    }
    
    func requestAuthorization() {
        SFSpeechRecognizer.requestAuthorization { authStatus in
            Task { @MainActor in
                switch authStatus {
                case .authorized:
                    self.isAuthorized = true
                case .denied:
                    self.errorMessage = "Speech recognition denied"
                case .restricted:
                    self.errorMessage = "Speech recognition restricted"
                case .notDetermined:
                    self.errorMessage = "Speech recognition not determined"
                @unknown default:
                    self.errorMessage = "Unknown authorization status"
                }
            }
        }
    }
    
    func startRecording() throws {
        // Cancel previous task if running
        if recognitionTask != nil {
            recognitionTask?.cancel()
            recognitionTask = nil
        }
        
        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        
        // Create new recognition request
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else { return }
        
        // Setup recognition request
        recognitionRequest.shouldReportPartialResults = true
        recognitionRequest.requiresOnDeviceRecognition = false
        
        // Get audio input
        let inputNode = audioEngine.inputNode
        
        // Create recognition task
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { result, error in
            var isFinal = false
            
            if let result = result {
                self.recognizedText = result.bestTranscription.formattedString
                isFinal = result.isFinal
            }
            
            if error != nil || isFinal {
                self.audioEngine.stop()
                inputNode.removeTap(onBus: 0)
                
                self.recognitionTask = nil
                self.recognitionRequest = nil
                
                if isFinal {
                    // Process the final text
                    self.processFoodFromSpeech(self.recognizedText)
                }
            }
        }
        
        // Configure audio input
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            recognitionRequest.append(buffer)
        }
        
        // Start audio engine
        audioEngine.prepare()
        try audioEngine.start()
        
        isRecording = true
        recognizedText = ""
    }
    
    func stopRecording() {
        audioEngine.stop()
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionTask = nil
        isRecording = false
    }
    
    private func processFoodFromSpeech(_ text: String) {
        // Extract food items from natural language
        let lowercasedText = text.lowercased()
        
        // Common patterns to remove
        let patterns = [
            "i ate ", "i had ", "just ate ", "just had ", "i'm eating ",
            "i'm having ", "for breakfast ", "for lunch ", "for dinner ",
            "for snack ", "i drank ", "i'm drinking ", "ordered ", "got "
        ]
        
        var cleanedText = lowercasedText
        for pattern in patterns {
            cleanedText = cleanedText.replacingOccurrences(of: pattern, with: "")
        }
        
        // Remove common filler words at the beginning
        let fillerWords = ["a ", "an ", "some ", "the ", "one ", "two ", "three "]
        for word in fillerWords {
            if cleanedText.hasPrefix(word) {
                cleanedText = String(cleanedText.dropFirst(word.count))
            }
        }
        
        // Clean up the text
        cleanedText = cleanedText.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Handle common speech patterns for GCC foods
        let gccFoodMappings = [
            "shwarma": "shawarma",
            "shawerma": "shawarma",
            "humus": "hummus",
            "hommos": "hummus",
            "labne": "labneh",
            "falafel sandwich": "falafel",
            "biryani rice": "biryani",
            "arabic coffee": "arabic coffee",
            "turkish coffee": "arabic coffee"
        ]
        
        for (spoken, correct) in gccFoodMappings {
            if cleanedText.contains(spoken) {
                cleanedText = cleanedText.replacingOccurrences(of: spoken, with: correct)
            }
        }
        
        // Post notification with cleaned food text
        NotificationCenter.default.post(
            name: NSNotification.Name("VoiceRecognitionCompleted"),
            object: nil,
            userInfo: ["foodText": cleanedText, "originalText": text]
        )
    }
}
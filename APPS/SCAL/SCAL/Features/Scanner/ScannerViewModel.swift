import Foundation
import AVFoundation
import UIKit
import Combine

@MainActor
class ScannerViewModel: NSObject, ObservableObject {
    // Published properties
    @Published var isFlashOn = false
    @Published var isCapturing = false
    @Published var isProcessing = false
    @Published var recognitionResults: [RecognizedFood]?
    @Published var activeMealResult: MealRecognitionResult?
    @Published var errorMessage: String?
    @Published var showError = false
    
    // Camera properties
    let cameraSession = AVCaptureSession()
    private var photoOutput = AVCapturePhotoOutput()
    private var currentCameraPosition: AVCaptureDevice.Position = .back
    private var photoCompletionHandler: ((UIImage) -> Void)?
    
    // Services
    private let recognitionCoordinator = FoodRecognitionCoordinator.shared
    
    // Queue for camera operations
    private let sessionQueue = DispatchQueue(label: "com.scal.camera.session")
    
    override init() {
        super.init()
        setupCamera()
    }
    
    // MARK: - Camera Setup
    
    private func setupCamera() {
        sessionQueue.async { [weak self] in
            self?.configureCameraSession()
        }
    }
    
    private func configureCameraSession() {
        cameraSession.beginConfiguration()
        cameraSession.sessionPreset = .photo
        
        // Add camera input
        guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera, 
                                                   for: .video, 
                                                   position: currentCameraPosition),
              let input = try? AVCaptureDeviceInput(device: camera) else {
            cameraSession.commitConfiguration()
            return
        }
        
        if cameraSession.canAddInput(input) {
            cameraSession.addInput(input)
        }
        
        // Add photo output
        if cameraSession.canAddOutput(photoOutput) {
            cameraSession.addOutput(photoOutput)
            photoOutput.isHighResolutionCaptureEnabled = true
        }
        
        cameraSession.commitConfiguration()
    }
    
    // MARK: - Camera Controls
    
    func startCamera() {
        checkCameraPermissions { [weak self] authorized in
            guard authorized else {
                self?.showPermissionError()
                return
            }
            
            self?.sessionQueue.async { [weak self] in
                if self?.cameraSession.isRunning == false {
                    self?.cameraSession.startRunning()
                }
            }
        }
    }
    
    func stopCamera() {
        sessionQueue.async { [weak self] in
            if self?.cameraSession.isRunning == true {
                self?.cameraSession.stopRunning()
            }
        }
    }
    
    func resumeCamera() {
        startCamera()
    }
    
    func toggleFlash() {
        isFlashOn.toggle()
    }
    
    func switchCamera() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            
            self.currentCameraPosition = self.currentCameraPosition == .back ? .front : .back
            
            self.cameraSession.beginConfiguration()
            
            // Remove existing input
            self.cameraSession.inputs.forEach { self.cameraSession.removeInput($0) }
            
            // Add new camera
            guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera,
                                                      for: .video,
                                                      position: self.currentCameraPosition),
                  let input = try? AVCaptureDeviceInput(device: camera) else {
                self.cameraSession.commitConfiguration()
                return
            }
            
            if self.cameraSession.canAddInput(input) {
                self.cameraSession.addInput(input)
            }
            
            self.cameraSession.commitConfiguration()
        }
    }
    
    // MARK: - Photo Capture
    
    func capturePhoto(completion: @escaping (UIImage) -> Void) {
        photoCompletionHandler = completion
        
        let settings = AVCapturePhotoSettings()
        settings.flashMode = isFlashOn ? .on : .off
        
        isCapturing = true
        photoOutput.capturePhoto(with: settings, delegate: self)
        
        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }
    
    // MARK: - Food Recognition
    
    func recognizeFood(in image: UIImage) async {
        isProcessing = true
        errorMessage = nil
        
        do {
            let result = try await recognitionCoordinator.recognizeSingleMeal(in: image)
            if result.foods.isEmpty {
                throw FoodRecognitionError.noFoodDetected
            }
            recognitionResults = result.foods
            activeMealResult = result
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isProcessing = false
    }

    func saveRecognizedFoodsAsMeal(name: String, foods: [Food], mealType: MealType = .other) {
        recognitionCoordinator.saveFoods(foods, name: name, mealType: mealType)
    }
    
    // MARK: - Permissions
    
    private func checkCameraPermissions(completion: @escaping (Bool) -> Void) {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            completion(true)
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    completion(granted)
                }
            }
        case .denied, .restricted:
            completion(false)
        @unknown default:
            completion(false)
        }
    }
    
    private func showPermissionError() {
        errorMessage = "Camera access is required to scan food. Please enable it in Settings."
        showError = true
    }
}

// MARK: - AVCapturePhotoCaptureDelegate

extension ScannerViewModel: AVCapturePhotoCaptureDelegate {
    func photoOutput(_ output: AVCapturePhotoOutput, 
                     didFinishProcessingPhoto photo: AVCapturePhoto, 
                     error: Error?) {
        isCapturing = false
        
        guard error == nil,
              let imageData = photo.fileDataRepresentation(),
              let image = UIImage(data: imageData) else {
            errorMessage = "Failed to capture photo"
            showError = true
            photoCompletionHandler?(UIImage())
            return
        }
        
        // Stop camera while processing
        stopCamera()
        
        photoCompletionHandler?(image)
    }
}

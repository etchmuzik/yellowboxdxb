//
//  SimpleFoodScannerView.swift
//  SCAL
//
//  Simplified food scanner that uses direct user input instead of ML Kit
//

import SwiftUI
import AVFoundation

struct SimpleFoodScannerView: View {
    @StateObject private var searchService = DirectFoodSearchService()
    @Environment(\.dismiss) private var dismiss
    
    @State private var capturedImage: UIImage?
    @State private var foodQuery = ""
    @State private var showingCamera = true
    @State private var showingResults = false
    @State private var selectedFood: SimpleFood?
    
    let onFoodSelected: (SimpleFood, UIImage?) -> Void
    
    var body: some View {
        NavigationView {
            ZStack {
                if showingCamera && capturedImage == nil {
                    // Camera view
                    CameraPreviewView(capturedImage: $capturedImage)
                        .ignoresSafeArea()
                        .overlay(alignment: .bottom) {
                            captureButton
                        }
                } else if let image = capturedImage {
                    // Captured image with search interface
                    VStack(spacing: 0) {
                        // Image preview
                        Image(uiImage: image)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(maxHeight: 300)
                            .cornerRadius(12)
                            .padding()
                        
                        // Search interface
                        VStack(spacing: 16) {
                            Text("What food is this?")
                                .font(.headline)
                            
                            // Search field
                            HStack {
                                Image(systemName: "magnifyingglass")
                                    .foregroundColor(.gray)
                                
                                TextField("Enter food name (e.g., popcorn)", text: $foodQuery)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .autocapitalization(.none)
                                    .submitLabel(.search)
                                    .onSubmit {
                                        searchFood()
                                    }
                                
                                if searchService.isSearching {
                                    ProgressView()
                                        .scaleEffect(0.8)
                                }
                            }
                            .padding(.horizontal)
                            
                            // Search button
                            Button(action: searchFood) {
                                Label("Search USDA Database", systemImage: "magnifyingglass")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                            .disabled(foodQuery.isEmpty || searchService.isSearching)
                            .padding(.horizontal)
                            
                            // Common suggestions
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack {
                                    ForEach(commonFoodSuggestions, id: \.self) { suggestion in
                                        Button(action: {
                                            foodQuery = suggestion
                                            searchFood()
                                        }) {
                                            Text(suggestion)
                                                .padding(.horizontal, 12)
                                                .padding(.vertical, 6)
                                                .background(Color.blue.opacity(0.1))
                                                .cornerRadius(15)
                                        }
                                    }
                                }
                                .padding(.horizontal)
                            }
                            
                            if let error = searchService.searchError {
                                Text(error)
                                    .foregroundColor(.red)
                                    .font(.caption)
                                    .padding(.horizontal)
                            }
                        }
                        
                        // Search results
                        if !searchService.searchResults.isEmpty {
                            List(searchService.searchResults) { food in
                                FoodResultRow(food: food) {
                                    selectedFood = food
                                    confirmSelection(food)
                                }
                            }
                            .listStyle(PlainListStyle())
                        }
                        
                        Spacer()
                    }
                    .background(Color(.systemBackground))
                }
            }
            .navigationTitle("Scan Food")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                if capturedImage != nil {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Retake") {
                            capturedImage = nil
                            foodQuery = ""
                            searchService.searchResults = []
                        }
                    }
                }
            }
        }
    }
    
    private var captureButton: some View {
        Button(action: {
            // Capture handled by camera view
        }) {
            ZStack {
                Circle()
                    .fill(Color.white)
                    .frame(width: 70, height: 70)
                
                Circle()
                    .stroke(Color.white, lineWidth: 3)
                    .frame(width: 80, height: 80)
            }
        }
        .padding(.bottom, 30)
    }
    
    private var commonFoodSuggestions: [String] {
        ["Popcorn", "Apple", "Pizza", "Salad", "Chicken", "Rice", "Pasta", "Burger", "Sandwich", "Coffee"]
    }
    
    private func searchFood() {
        Task {
            await searchService.searchFood(query: foodQuery)
        }
    }
    
    private func confirmSelection(_ food: SimpleFood) {
        onFoodSelected(food, capturedImage)
        dismiss()
    }
}

// Simple food result row
struct FoodResultRow: View {
    let food: SimpleFood
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 4) {
                Text(food.name)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                if let brand = food.brand {
                    Text(brand)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Label("\(Int(food.calories)) cal", systemImage: "flame.fill")
                        .font(.caption)
                        .foregroundColor(.orange)
                    
                    Spacer()
                    
                    if let servingSize = food.servingSize, let unit = food.servingUnit {
                        Text("per \(servingSize) \(unit)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(.vertical, 8)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// Simple camera preview
struct CameraPreviewView: UIViewControllerRepresentable {
    @Binding var capturedImage: UIImage?
    
    func makeUIViewController(context: Context) -> CameraViewController {
        let controller = CameraViewController()
        controller.delegate = context.coordinator
        return controller
    }
    
    func updateUIViewController(_ uiViewController: CameraViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, CameraViewControllerDelegate {
        let parent: CameraPreviewView
        
        init(_ parent: CameraPreviewView) {
            self.parent = parent
        }
        
        func didCaptureImage(_ image: UIImage) {
            parent.capturedImage = image
        }
    }
}

// Camera view controller
protocol CameraViewControllerDelegate: AnyObject {
    func didCaptureImage(_ image: UIImage)
}

class CameraViewController: UIViewController {
    weak var delegate: CameraViewControllerDelegate?
    private var captureSession: AVCaptureSession?
    private var photoOutput: AVCapturePhotoOutput?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupCamera()
    }
    
    private func setupCamera() {
        captureSession = AVCaptureSession()
        captureSession?.sessionPreset = .photo
        
        guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let input = try? AVCaptureDeviceInput(device: camera),
              let captureSession = captureSession else { return }
        
        if captureSession.canAddInput(input) {
            captureSession.addInput(input)
        }
        
        photoOutput = AVCapturePhotoOutput()
        if let photoOutput = photoOutput, captureSession.canAddOutput(photoOutput) {
            captureSession.addOutput(photoOutput)
        }
        
        previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer?.videoGravity = .resizeAspectFill
        previewLayer?.frame = view.bounds
        
        if let previewLayer = previewLayer {
            view.layer.addSublayer(previewLayer)
        }
        
        DispatchQueue.global(qos: .userInitiated).async {
            captureSession.startRunning()
        }
        
        // Add tap gesture for capture
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(capturePhoto))
        view.addGestureRecognizer(tapGesture)
    }
    
    @objc private func capturePhoto() {
        let settings = AVCapturePhotoSettings()
        photoOutput?.capturePhoto(with: settings, delegate: self)
    }
}

extension CameraViewController: AVCapturePhotoCaptureDelegate {
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        guard let imageData = photo.fileDataRepresentation(),
              let image = UIImage(data: imageData) else { return }
        
        delegate?.didCaptureImage(image)
    }
}
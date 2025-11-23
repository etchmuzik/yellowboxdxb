import SwiftUI
import AVFoundation

struct ScannerView: View {
    @StateObject private var viewModel = ScannerViewModel()
    @State private var showingResults = false
    @State private var capturedImage: UIImage?
    
    var body: some View {
        ZStack {
            // Camera preview
            CameraPreviewView(session: viewModel.cameraSession)
                .ignoresSafeArea()
                .overlay(scanningOverlay)
            
            // UI Controls
            VStack {
                // Top bar
                topBar
                
                Spacer()
                
                // Bottom controls
                bottomControls
            }
            
            // Loading overlay
            if viewModel.isProcessing {
                loadingOverlay
            }
        }
        .onAppear {
            viewModel.startCamera()
        }
        .onDisappear {
            viewModel.stopCamera()
        }
        .sheet(isPresented: $showingResults) {
            if let image = capturedImage,
               let results = viewModel.recognitionResults {
                FoodResultView(
                    image: image,
                    results: results,
                    onConfirm: { foods in
                        viewModel.saveRecognizedFoodsAsMeal(name: "Scanned Meal", foods: foods)
                        showingResults = false
                    },
                    onCancel: {
                        showingResults = false
                        viewModel.resumeCamera()
                    }
                )
            }
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK") {
                viewModel.errorMessage = nil
            }
        } message: {
            Text(viewModel.errorMessage ?? "An error occurred")
        }
    }
    
    // MARK: - UI Components
    
    private var scanningOverlay: some View {
        GeometryReader { geometry in
            ZStack {
                // Darkened areas
                Color.black.opacity(0.5)
                
                // Clear scanning area
                RoundedRectangle(cornerRadius: 20)
                    .frame(width: geometry.size.width * 0.8,
                           height: geometry.size.width * 0.8)
                    .blendMode(.destinationOut)
                
                // Scanning frame
                RoundedRectangle(cornerRadius: 20)
                    .stroke(Color.white, lineWidth: 3)
                    .frame(width: geometry.size.width * 0.8,
                           height: geometry.size.width * 0.8)
                
                // Corner brackets
                ScannerCornersView()
                    .frame(width: geometry.size.width * 0.8,
                           height: geometry.size.width * 0.8)
            }
            .compositingGroup()
        }
    }
    
    private var topBar: some View {
        HStack {
            Button(action: { viewModel.toggleFlash() }) {
                Image(systemName: viewModel.isFlashOn ? "bolt.fill" : "bolt.slash.fill")
                    .font(.title2)
                    .foregroundColor(.white)
                    .frame(width: 44, height: 44)
                    .background(Color.black.opacity(0.6))
                    .clipShape(Circle())
            }
            
            Spacer()
            
            Text("SCAN FOOD")
                .font(.headline)
                .foregroundColor(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(Color.black.opacity(0.6))
                .cornerRadius(20)
            
            Spacer()
            
            Button(action: { viewModel.switchCamera() }) {
                Image(systemName: "camera.rotate")
                    .font(.title2)
                    .foregroundColor(.white)
                    .frame(width: 44, height: 44)
                    .background(Color.black.opacity(0.6))
                    .clipShape(Circle())
            }
        }
        .padding(.horizontal)
        .padding(.top, 60)
    }
    
    private var bottomControls: some View {
        VStack(spacing: 20) {
            // Capture button
            Button(action: capturePhoto) {
                ZStack {
                    Circle()
                        .fill(Color.white)
                        .frame(width: 70, height: 70)
                    
                    Circle()
                        .stroke(Color.white, lineWidth: 4)
                        .frame(width: 80, height: 80)
                }
            }
            .scaleEffect(viewModel.isCapturing ? 0.9 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: viewModel.isCapturing)
            
            // Info text
            VStack(spacing: 5) {
                Text("Point at your meal")
                    .font(.headline)
                    .foregroundColor(.white)
                
                Text("AI will identify food & nutrition")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.8))
            }
            .padding(.horizontal, 30)
            .padding(.vertical, 15)
            .background(Color.black.opacity(0.6))
            .cornerRadius(25)
        }
        .padding(.bottom, 50)
    }
    
    private var loadingOverlay: some View {
        ZStack {
            Color.black.opacity(0.7)
                .ignoresSafeArea()
            
            VStack(spacing: 20) {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    .scaleEffect(1.5)
                
                Text("Analyzing your meal...")
                    .font(.headline)
                    .foregroundColor(.white)
                
                Text("Using AI to identify food and nutrition")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.8))
            }
            .padding(40)
            .background(Color.black.opacity(0.8))
            .cornerRadius(20)
        }
    }
    
    // MARK: - Actions
    
    private func capturePhoto() {
        viewModel.capturePhoto { image in
            self.capturedImage = image
            
            Task {
                await viewModel.recognizeFood(in: image)
                await MainActor.run {
                    self.showingResults = true
                }
            }
        }
    }
}

// MARK: - Scanner Corners View
struct ScannerCornersView: View {
    var body: some View {
        GeometryReader { geometry in
            let cornerLength: CGFloat = 30
            let cornerWidth: CGFloat = 4
            
            // Top-left
            Path { path in
                path.move(to: CGPoint(x: 0, y: cornerLength))
                path.addLine(to: CGPoint(x: 0, y: 0))
                path.addLine(to: CGPoint(x: cornerLength, y: 0))
            }
            .stroke(Color.green, lineWidth: cornerWidth)
            
            // Top-right
            Path { path in
                path.move(to: CGPoint(x: geometry.size.width - cornerLength, y: 0))
                path.addLine(to: CGPoint(x: geometry.size.width, y: 0))
                path.addLine(to: CGPoint(x: geometry.size.width, y: cornerLength))
            }
            .stroke(Color.green, lineWidth: cornerWidth)
            
            // Bottom-left
            Path { path in
                path.move(to: CGPoint(x: 0, y: geometry.size.height - cornerLength))
                path.addLine(to: CGPoint(x: 0, y: geometry.size.height))
                path.addLine(to: CGPoint(x: cornerLength, y: geometry.size.height))
            }
            .stroke(Color.green, lineWidth: cornerWidth)
            
            // Bottom-right
            Path { path in
                path.move(to: CGPoint(x: geometry.size.width - cornerLength, y: geometry.size.height))
                path.addLine(to: CGPoint(x: geometry.size.width, y: geometry.size.height))
                path.addLine(to: CGPoint(x: geometry.size.width, y: geometry.size.height - cornerLength))
            }
            .stroke(Color.green, lineWidth: cornerWidth)
        }
    }
}

#Preview {
    ScannerView()
}
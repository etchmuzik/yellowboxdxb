//
//  ButtonComponents.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Reusable button components for consistent UI
//

import SwiftUI

// MARK: - Primary Action Button

struct PrimaryActionButton: View {
    let title: String
    let icon: String?
    let action: () -> Void
    var isLoading: Bool = false
    var isDisabled: Bool = false
    
    init(
        _ title: String,
        icon: String? = nil,
        isLoading: Bool = false,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.icon = icon
        self.isLoading = isLoading
        self.isDisabled = isDisabled
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .black))
                        .scaleEffect(0.8)
                } else {
                    if let icon = icon {
                        Image(systemName: icon)
                            .font(.headline)
                    }
                    
                    Text(title)
                        .font(.headline.bold())
                }
            }
            .foregroundColor(.black)
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                LinearGradient(
                    colors: isDisabled ? [.gray, .gray] : [.orange, .red],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(16)
            .opacity(isDisabled ? 0.6 : 1.0)
        }
        .disabled(isDisabled || isLoading)
    }
}

// MARK: - Secondary Action Button

struct SecondaryActionButton: View {
    let title: String
    let icon: String?
    let action: () -> Void
    var color: Color = .orange
    var isDisabled: Bool = false
    
    init(
        _ title: String,
        icon: String? = nil,
        color: Color = .orange,
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.icon = icon
        self.color = color
        self.isDisabled = isDisabled
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.headline)
                }
                
                Text(title)
                    .font(.headline)
            }
            .foregroundColor(isDisabled ? .gray : color)
            .frame(maxWidth: .infinity)
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isDisabled ? .gray : color, lineWidth: 2)
                    .background(Color.clear)
            )
        }
        .disabled(isDisabled)
    }
}

// MARK: - Icon Button

struct IconButton: View {
    let icon: String
    let action: () -> Void
    var color: Color = .orange
    var size: CGFloat = 24
    var backgroundColor: Color = Color.gray.opacity(0.2)
    var isDisabled: Bool = false
    
    init(
        icon: String,
        color: Color = .orange,
        size: CGFloat = 24,
        backgroundColor: Color = Color.gray.opacity(0.2),
        isDisabled: Bool = false,
        action: @escaping () -> Void
    ) {
        self.icon = icon
        self.color = color
        self.size = size
        self.backgroundColor = backgroundColor
        self.isDisabled = isDisabled
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: size))
                .foregroundColor(isDisabled ? .gray : color)
                .frame(width: size + 16, height: size + 16)
                .background(backgroundColor)
                .clipShape(Circle())
        }
        .disabled(isDisabled)
    }
}

// MARK: - Floating Action Button

struct FloatingActionButton: View {
    let icon: String
    let action: () -> Void
    var color: Color = .orange
    var size: CGFloat = 56
    
    init(
        icon: String,
        color: Color = .orange,
        size: CGFloat = 56,
        action: @escaping () -> Void
    ) {
        self.icon = icon
        self.color = color
        self.size = size
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.title2.bold())
                .foregroundColor(.white)
                .frame(width: size, height: size)
                .background(
                    LinearGradient(
                        colors: [color, color.opacity(0.8)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .clipShape(Circle())
                .shadow(color: color.opacity(0.3), radius: 8, x: 0, y: 4)
        }
        .scaleEffect(1.0)
        .animation(.easeInOut(duration: 0.1), value: false)
    }
}

// MARK: - Quick Action Grid Button

struct QuickActionGridButton: View {
    let title: String
    let subtitle: String?
    let icon: String
    let color: Color
    let action: () -> Void
    
    init(
        title: String,
        subtitle: String? = nil,
        icon: String,
        color: Color,
        action: @escaping () -> Void
    ) {
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.color = color
        self.action = action
    }
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                
                Text(title)
                    .font(.caption.bold())
                    .foregroundColor(.white)
                
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
            }
            .frame(maxWidth: .infinity, minHeight: 80)
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(16)
        }
    }
}

// MARK: - Toggle Button

struct ToggleButton: View {
    let title: String
    let icon: String
    @Binding var isOn: Bool
    var activeColor: Color = .orange
    
    init(
        title: String,
        icon: String,
        isOn: Binding<Bool>,
        activeColor: Color = .orange
    ) {
        self.title = title
        self.icon = icon
        self._isOn = isOn
        self.activeColor = activeColor
    }
    
    var body: some View {
        Button {
            withAnimation(.easeInOut(duration: 0.2)) {
                isOn.toggle()
            }
        } label: {
            HStack {
                Image(systemName: icon)
                    .font(.headline)
                    .foregroundColor(isOn ? activeColor : .gray)
                
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.white)
                
                Spacer()
                
                RoundedRectangle(cornerRadius: 16)
                    .fill(isOn ? activeColor : Color.gray.opacity(0.3))
                    .frame(width: 50, height: 30)
                    .overlay(
                        Circle()
                            .fill(Color.white)
                            .frame(width: 26, height: 26)
                            .offset(x: isOn ? 10 : -10)
                            .animation(.easeInOut(duration: 0.2), value: isOn)
                    )
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(12)
        }
    }
}

// MARK: - Quantity Stepper Button

struct QuantityStepperButton: View {
    @Binding var value: Double
    let step: Double
    let range: ClosedRange<Double>
    let formatter: NumberFormatter
    
    init(
        value: Binding<Double>,
        step: Double = 0.5,
        range: ClosedRange<Double> = 0.5...10.0,
        formatter: NumberFormatter = {
            let fmt = NumberFormatter()
            fmt.numberStyle = .decimal
            fmt.minimumFractionDigits = 1
            fmt.maximumFractionDigits = 1
            return fmt
        }()
    ) {
        self._value = value
        self.step = step
        self.range = range
        self.formatter = formatter
    }
    
    var body: some View {
        HStack(spacing: 16) {
            Button("-") {
                let newValue = max(range.lowerBound, value - step)
                value = newValue
            }
            .font(.title2.bold())
            .foregroundColor(.orange)
            .frame(width: 40, height: 40)
            .background(Color.gray.opacity(0.2))
            .clipShape(Circle())
            .disabled(value <= range.lowerBound)
            
            Text(formatter.string(from: NSNumber(value: value)) ?? "\(value)")
                .font(.title2.bold())
                .foregroundColor(.white)
                .frame(minWidth: 60)
            
            Button("+") {
                let newValue = min(range.upperBound, value + step)
                value = newValue
            }
            .font(.title2.bold())
            .foregroundColor(.orange)
            .frame(width: 40, height: 40)
            .background(Color.gray.opacity(0.2))
            .clipShape(Circle())
            .disabled(value >= range.upperBound)
        }
    }
}

// MARK: - Preview

#if DEBUG
struct ButtonComponents_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            PrimaryActionButton("Log Meal", icon: "plus.circle.fill") { }
            
            SecondaryActionButton("Cancel", icon: "xmark") { }
            
            HStack {
                IconButton(icon: "heart.fill", color: .red) { }
                IconButton(icon: "star.fill", color: .yellow) { }
                IconButton(icon: "bookmark.fill", color: .blue) { }
            }
            
            FloatingActionButton(icon: "plus") { }
            
            ToggleButton(
                title: "Prefer Local Foods",
                icon: "globe.americas.fill",
                isOn: .constant(true)
            )
            
            QuantityStepperButton(value: .constant(1.0))
        }
        .padding()
        .background(Color.black)
    }
}
#endif
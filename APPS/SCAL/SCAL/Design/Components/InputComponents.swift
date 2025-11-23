//
//  InputComponents.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Reusable input components for forms and data entry
//

import SwiftUI

// MARK: - Custom Text Field

struct CustomTextField: View {
    let title: String
    let placeholder: String
    @Binding var text: String
    var icon: String? = nil
    var keyboardType: UIKeyboardType = .default
    var isSecure: Bool = false
    var errorMessage: String? = nil
    
    init(
        title: String,
        placeholder: String,
        text: Binding<String>,
        icon: String? = nil,
        keyboardType: UIKeyboardType = .default,
        isSecure: Bool = false,
        errorMessage: String? = nil
    ) {
        self.title = title
        self.placeholder = placeholder
        self._text = text
        self.icon = icon
        self.keyboardType = keyboardType
        self.isSecure = isSecure
        self.errorMessage = errorMessage
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline.bold())
                .foregroundColor(.white)
            
            HStack {
                if let icon = icon {
                    Image(systemName: icon)
                        .foregroundColor(.gray)
                        .frame(width: 20)
                }
                
                if isSecure {
                    SecureField(placeholder, text: $text)
                        .textFieldStyle(PlainTextFieldStyle())
                        .foregroundColor(.white)
                } else {
                    TextField(placeholder, text: $text)
                        .textFieldStyle(PlainTextFieldStyle())
                        .keyboardType(keyboardType)
                        .foregroundColor(.white)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(errorMessage != nil ? Color.red : Color.gray.opacity(0.3), lineWidth: 1)
                    )
            )
            
            if let errorMessage = errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
    }
}

// MARK: - Number Input Field

struct NumberInputField<T: Numeric & LosslessStringConvertible>: View {
    let title: String
    let placeholder: String
    @Binding var value: T
    let formatter: NumberFormatter
    var icon: String? = nil
    var range: ClosedRange<T>? = nil
    var errorMessage: String? = nil
    
    init(
        title: String,
        placeholder: String,
        value: Binding<T>,
        formatter: NumberFormatter,
        icon: String? = nil,
        range: ClosedRange<T>? = nil,
        errorMessage: String? = nil
    ) {
        self.title = title
        self.placeholder = placeholder
        self._value = value
        self.formatter = formatter
        self.icon = icon
        self.range = range
        self.errorMessage = errorMessage
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline.bold())
                .foregroundColor(.white)
            
            HStack {
                if let icon = icon {
                    Image(systemName: icon)
                        .foregroundColor(.gray)
                        .frame(width: 20)
                }
                
                TextField(placeholder, value: $value, formatter: formatter)
                    .textFieldStyle(PlainTextFieldStyle())
                    .keyboardType(.decimalPad)
                    .foregroundColor(.white)
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(errorMessage != nil ? Color.red : Color.gray.opacity(0.3), lineWidth: 1)
                    )
            )
            
            if let errorMessage = errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
            }
        }
    }
}

// MARK: - Search Bar

struct SearchBar: View {
    @Binding var text: String
    var placeholder: String = "Search..."
    var onSearchButtonClicked: (() -> Void)? = nil
    var onCancelButtonClicked: (() -> Void)? = nil
    
    @State private var isEditing = false
    
    init(
        text: Binding<String>,
        placeholder: String = "Search...",
        onSearchButtonClicked: (() -> Void)? = nil,
        onCancelButtonClicked: (() -> Void)? = nil
    ) {
        self._text = text
        self.placeholder = placeholder
        self.onSearchButtonClicked = onSearchButtonClicked
        self.onCancelButtonClicked = onCancelButtonClicked
    }
    
    var body: some View {
        HStack {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.gray)
                
                TextField(placeholder, text: $text, onEditingChanged: { editing in
                    isEditing = editing
                }, onCommit: {
                    onSearchButtonClicked?()
                })
                .foregroundColor(.white)
                .textFieldStyle(PlainTextFieldStyle())
                
                if !text.isEmpty {
                    Button(action: {
                        text = ""
                    }) {
                        Image(systemName: "multiply.circle.fill")
                            .foregroundColor(.gray)
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.gray.opacity(0.1))
            )
            
            if isEditing {
                Button("Cancel") {
                    isEditing = false
                    text = ""
                    onCancelButtonClicked?()
                    // Hide keyboard
                    UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
                }
                .foregroundColor(.orange)
                .animation(.easeInOut(duration: 0.2), value: isEditing)
            }
        }
    }
}

// MARK: - Custom Picker

struct CustomPicker<T: Hashable>: View {
    let title: String
    let options: [T]
    @Binding var selection: T
    let displayText: (T) -> String
    var icon: String? = nil
    
    init(
        title: String,
        options: [T],
        selection: Binding<T>,
        displayText: @escaping (T) -> String,
        icon: String? = nil
    ) {
        self.title = title
        self.options = options
        self._selection = selection
        self.displayText = displayText
        self.icon = icon
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline.bold())
                .foregroundColor(.white)
            
            HStack {
                if let icon = icon {
                    Image(systemName: icon)
                        .foregroundColor(.gray)
                        .frame(width: 20)
                }
                
                Picker(title, selection: $selection) {
                    ForEach(options, id: \.self) { option in
                        Text(displayText(option))
                            .tag(option)
                            .foregroundColor(.white)
                    }
                }
                .pickerStyle(MenuPickerStyle())
                .foregroundColor(.white)
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                    )
            )
        }
    }
}

// MARK: - Segmented Picker

struct SegmentedPicker<T: Hashable>: View {
    let title: String
    let options: [T]
    @Binding var selection: T
    let displayText: (T) -> String
    var activeColor: Color = .orange
    
    init(
        title: String,
        options: [T],
        selection: Binding<T>,
        displayText: @escaping (T) -> String,
        activeColor: Color = .orange
    ) {
        self.title = title
        self.options = options
        self._selection = selection
        self.displayText = displayText
        self.activeColor = activeColor
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline.bold())
                .foregroundColor(.white)
            
            HStack(spacing: 0) {
                ForEach(Array(options.enumerated()), id: \.offset) { index, option in
                    Button(action: {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selection = option
                        }
                    }) {
                        Text(displayText(option))
                            .font(.subheadline)
                            .foregroundColor(selection == option ? .black : .white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(
                                RoundedRectangle(
                                    cornerRadius: 8,
                                    style: .continuous
                                )
                                .fill(selection == option ? activeColor : Color.clear)
                            )
                    }
                }
            }
            .padding(4)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.1))
            )
        }
    }
}

// MARK: - Slider Input

struct SliderInput: View {
    let title: String
    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double
    let formatter: NumberFormatter
    var unit: String = ""
    var color: Color = .orange
    
    init(
        title: String,
        value: Binding<Double>,
        range: ClosedRange<Double>,
        step: Double = 1.0,
        formatter: NumberFormatter,
        unit: String = "",
        color: Color = .orange
    ) {
        self.title = title
        self._value = value
        self.range = range
        self.step = step
        self.formatter = formatter
        self.unit = unit
        self.color = color
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(title)
                    .font(.subheadline.bold())
                    .foregroundColor(.white)
                
                Spacer()
                
                Text("\(formatter.string(from: NSNumber(value: value)) ?? "\(value)")\(unit)")
                    .font(.subheadline.bold())
                    .foregroundColor(color)
            }
            
            HStack {
                Text("\(Int(range.lowerBound))")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                Slider(value: $value, in: range, step: step)
                    .accentColor(color)
                
                Text("\(Int(range.upperBound))")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.gray.opacity(0.1))
        )
    }
}

// MARK: - Multi-line Text Editor

struct MultilineTextEditor: View {
    let title: String
    let placeholder: String
    @Binding var text: String
    var minHeight: CGFloat = 100
    var maxHeight: CGFloat = 200
    
    init(
        title: String,
        placeholder: String,
        text: Binding<String>,
        minHeight: CGFloat = 100,
        maxHeight: CGFloat = 200
    ) {
        self.title = title
        self.placeholder = placeholder
        self._text = text
        self.minHeight = minHeight
        self.maxHeight = maxHeight
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline.bold())
                .foregroundColor(.white)
            
            ZStack(alignment: .topLeading) {
                if text.isEmpty {
                    Text(placeholder)
                        .foregroundColor(.gray)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 12)
                }
                
                TextEditor(text: $text)
                    .foregroundColor(.white)
                    .scrollContentBackground(.hidden)
                    .frame(minHeight: minHeight, maxHeight: maxHeight)
            }
            .padding(4)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                    )
            )
        }
    }
}

// MARK: - Preview

#if DEBUG
struct InputComponents_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(spacing: 20) {
                CustomTextField(
                    title: "Name",
                    placeholder: "Enter your name",
                    text: .constant(""),
                    icon: "person.fill"
                )
                
                NumberInputField(
                    title: "Weight",
                    placeholder: "70.0",
                    value: .constant(70.0),
                    formatter: {
                        let fmt = NumberFormatter()
                        fmt.numberStyle = .decimal
                        fmt.minimumFractionDigits = 1
                        return fmt
                    }(),
                    icon: "scalemass.fill"
                )
                
                SearchBar(text: .constant(""))
                
                CustomPicker(
                    title: "Gender",
                    options: ["Male", "Female", "Other"],
                    selection: .constant("Other"),
                    displayText: { $0 },
                    icon: "person.2.fill"
                )
                
                SegmentedPicker(
                    title: "Activity Level",
                    options: ["Low", "Moderate", "High"],
                    selection: .constant("Moderate"),
                    displayText: { $0 }
                )
                
                SliderInput(
                    title: "Daily Calorie Goal",
                    value: .constant(2000),
                    range: 1200...3500,
                    step: 50,
                    formatter: {
                        let fmt = NumberFormatter()
                        fmt.numberStyle = .decimal
                        fmt.maximumFractionDigits = 0
                        return fmt
                    }(),
                    unit: " cal"
                )
                
                MultilineTextEditor(
                    title: "Notes",
                    placeholder: "Add any additional notes...",
                    text: .constant("")
                )
            }
            .padding()
        }
        .background(Color.black)
    }
}
#endif
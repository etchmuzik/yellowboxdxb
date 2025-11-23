//
//  LayoutComponents.swift
//  SCAL - Smart Calorie Analysis Lens
//
//  Reusable layout components for consistent structure
//

import SwiftUI

// MARK: - Section Container

struct SectionContainer<Content: View>: View {
    let title: String
    let subtitle: String?
    let icon: String?
    let content: Content
    var headerAction: (() -> Void)? = nil
    var headerActionTitle: String? = nil
    
    init(
        title: String,
        subtitle: String? = nil,
        icon: String? = nil,
        headerAction: (() -> Void)? = nil,
        headerActionTitle: String? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.content = content()
        self.headerAction = headerAction
        self.headerActionTitle = headerActionTitle
    }
    
    var body: some View {
        VStack(spacing: 16) {
            // Section Header
            HStack {
                HStack(spacing: 8) {
                    if let icon = icon {
                        Image(systemName: icon)
                            .foregroundColor(.orange)
                            .font(.headline)
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title)
                            .font(.headline.bold())
                            .foregroundColor(.white)
                        
                        if let subtitle = subtitle {
                            Text(subtitle)
                                .font(.caption)
                                .foregroundColor(.gray)
                        }
                    }
                }
                
                Spacer()
                
                if let headerAction = headerAction {
                    Button(action: headerAction) {
                        Text(headerActionTitle ?? "View All")
                            .font(.caption.bold())
                            .foregroundColor(.orange)
                    }
                }
            }
            
            // Section Content
            content
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.gray.opacity(0.1))
        )
    }
}

// MARK: - Grid Layout

struct AdaptiveGrid<Content: View>: View {
    let content: Content
    let minItemWidth: CGFloat
    let spacing: CGFloat
    
    init(
        minItemWidth: CGFloat = 150,
        spacing: CGFloat = 12,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.minItemWidth = minItemWidth
        self.spacing = spacing
    }
    
    private var columns: [GridItem] {
        [GridItem(.adaptive(minimum: minItemWidth), spacing: spacing)]
    }
    
    var body: some View {
        LazyVGrid(columns: columns, spacing: spacing) {
            content
        }
    }
}

// MARK: - Tab Container

struct TabContainer<Content: View>: View {
    let tabs: [String]
    @Binding var selectedTab: Int
    let content: Content
    var activeColor: Color = .orange
    
    init(
        tabs: [String],
        selectedTab: Binding<Int>,
        activeColor: Color = .orange,
        @ViewBuilder content: () -> Content
    ) {
        self.tabs = tabs
        self._selectedTab = selectedTab
        self.activeColor = activeColor
        self.content = content()
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Tab Header
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 0) {
                    ForEach(Array(tabs.enumerated()), id: \.offset) { index, tab in
                        Button(action: {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                selectedTab = index
                            }
                        }) {
                            VStack(spacing: 8) {
                                Text(tab)
                                    .font(.subheadline.bold())
                                    .foregroundColor(selectedTab == index ? activeColor : .gray)
                                
                                Rectangle()
                                    .fill(selectedTab == index ? activeColor : Color.clear)
                                    .frame(height: 2)
                            }
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .padding(.horizontal)
            }
            .background(
                Rectangle()
                    .fill(Color.gray.opacity(0.1))
                    .frame(height: 1)
                    .offset(y: 20)
            )
            
            // Tab Content
            content
                .transition(.opacity)
        }
    }
}

// MARK: - Loading State

struct LoadingStateView: View {
    let message: String
    var color: Color = .orange
    
    init(message: String = "Loading...", color: Color = .orange) {
        self.message = message
        self.color = color
    }
    
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: color))
                .scaleEffect(1.5)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.black.opacity(0.8))
    }
}

// MARK: - Empty State

struct EmptyStateView: View {
    let title: String
    let subtitle: String
    let icon: String
    let actionTitle: String?
    let action: (() -> Void)?
    
    init(
        title: String,
        subtitle: String,
        icon: String,
        actionTitle: String? = nil,
        action: (() -> Void)? = nil
    ) {
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.actionTitle = actionTitle
        self.action = action
    }
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(.gray)
            
            VStack(spacing: 8) {
                Text(title)
                    .font(.headline.bold())
                    .foregroundColor(.white)
                
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
            }
            
            if let actionTitle = actionTitle, let action = action {
                PrimaryActionButton(actionTitle, action: action)
                    .frame(maxWidth: 200)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Error State

struct ErrorStateView: View {
    let title: String
    let subtitle: String
    let retryAction: (() -> Void)?
    
    init(
        title: String = "Something went wrong",
        subtitle: String = "Please try again later",
        retryAction: (() -> Void)? = nil
    ) {
        self.title = title
        self.subtitle = subtitle
        self.retryAction = retryAction
    }
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 60))
                .foregroundColor(.red)
            
            VStack(spacing: 8) {
                Text(title)
                    .font(.headline.bold())
                    .foregroundColor(.white)
                
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
            }
            
            if let retryAction = retryAction {
                SecondaryActionButton(
                    "Try Again",
                    icon: "arrow.clockwise",
                    color: .red,
                    action: retryAction
                )
                .frame(maxWidth: 200)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Header with Action

struct PageHeader: View {
    let title: String
    let subtitle: String?
    let backAction: (() -> Void)?
    let rightAction: (() -> Void)?
    let rightActionIcon: String?
    let rightActionTitle: String?
    
    init(
        title: String,
        subtitle: String? = nil,
        backAction: (() -> Void)? = nil,
        rightAction: (() -> Void)? = nil,
        rightActionIcon: String? = nil,
        rightActionTitle: String? = nil
    ) {
        self.title = title
        self.subtitle = subtitle
        self.backAction = backAction
        self.rightAction = rightAction
        self.rightActionIcon = rightActionIcon
        self.rightActionTitle = rightActionTitle
    }
    
    var body: some View {
        HStack {
            // Back Button
            if let backAction = backAction {
                IconButton(
                    icon: "chevron.left",
                    color: .orange,
                    action: backAction
                )
            }
            
            // Title Section
            VStack(alignment: backAction != nil ? .leading : .center, spacing: 4) {
                Text(title)
                    .font(.title2.bold())
                    .foregroundColor(.white)
                
                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
            }
            
            if backAction != nil {
                Spacer()
            }
            
            // Right Action
            if let rightAction = rightAction {
                if let rightActionIcon = rightActionIcon {
                    IconButton(
                        icon: rightActionIcon,
                        color: .orange,
                        action: rightAction
                    )
                } else if let rightActionTitle = rightActionTitle {
                    Button(action: rightAction) {
                        Text(rightActionTitle)
                            .font(.subheadline.bold())
                            .foregroundColor(.orange)
                    }
                }
            }
        }
        .padding(.horizontal)
        .padding(.top, 8)
    }
}

// MARK: - Dismissible Banner

struct DismissibleBanner: View {
    let message: String
    let type: BannerType
    @Binding var isVisible: Bool
    var action: (() -> Void)? = nil
    var actionTitle: String? = nil
    
    enum BannerType {
        case info, success, warning, error
        
        var color: Color {
            switch self {
            case .info: return .blue
            case .success: return .green
            case .warning: return .orange
            case .error: return .red
            }
        }
        
        var icon: String {
            switch self {
            case .info: return "info.circle.fill"
            case .success: return "checkmark.circle.fill"
            case .warning: return "exclamationmark.triangle.fill"
            case .error: return "xmark.circle.fill"
            }
        }
    }
    
    init(
        message: String,
        type: BannerType,
        isVisible: Binding<Bool>,
        action: (() -> Void)? = nil,
        actionTitle: String? = nil
    ) {
        self.message = message
        self.type = type
        self._isVisible = isVisible
        self.action = action
        self.actionTitle = actionTitle
    }
    
    var body: some View {
        if isVisible {
            HStack {
                Image(systemName: type.icon)
                    .foregroundColor(type.color)
                
                Text(message)
                    .font(.subheadline)
                    .foregroundColor(.white)
                    .lineLimit(2)
                
                Spacer()
                
                if let action = action, let actionTitle = actionTitle {
                    Button(action: action) {
                        Text(actionTitle)
                            .font(.caption.bold())
                            .foregroundColor(type.color)
                    }
                }
                
                Button(action: {
                    withAnimation(.easeInOut) {
                        isVisible = false
                    }
                }) {
                    Image(systemName: "xmark")
                        .foregroundColor(.gray)
                        .font(.caption)
                }
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(type.color.opacity(0.1))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(type.color.opacity(0.3), lineWidth: 1)
                    )
            )
            .transition(.slide)
        }
    }
}

// MARK: - Pull to Refresh

struct PullToRefresh: View {
    var coordinateSpaceName: String
    var onRefresh: () -> Void
    
    @State private var needRefresh: Bool = false
    
    var body: some View {
        GeometryReader { geo in
            if geo.frame(in: .named(coordinateSpaceName)).midY > 50 {
                Spacer()
                    .onAppear {
                        needRefresh = true
                    }
            } else if needRefresh {
                Spacer()
                    .onAppear {
                        onRefresh()
                        needRefresh = false
                    }
            }
            
            HStack {
                Spacer()
                if needRefresh {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .orange))
                } else {
                    Text("⬇️")
                }
                Spacer()
            }
        }
        .frame(height: 50)
    }
}

// MARK: - Preview

#if DEBUG
struct LayoutComponents_Previews: PreviewProvider {
    static var previews: some View {
        ScrollView {
            VStack(spacing: 20) {
                PageHeader(
                    title: "Food Scanner",
                    subtitle: "Scan your meals",
                    backAction: { },
                    rightAction: { },
                    rightActionIcon: "gear"
                )
                
                SectionContainer(
                    title: "Today's Meals",
                    subtitle: "3 meals logged",
                    icon: "fork.knife",
                    headerAction: { },
                    headerActionTitle: "View All"
                ) {
                    Text("Meal content here")
                        .foregroundColor(.white)
                }
                
                TabContainer(
                    tabs: ["Overview", "Details", "History"],
                    selectedTab: .constant(0)
                ) {
                    Text("Tab content here")
                        .foregroundColor(.white)
                        .frame(height: 200)
                }
                
                DismissibleBanner(
                    message: "Welcome to SCAL! Start by scanning your first meal.",
                    type: .info,
                    isVisible: .constant(true),
                    action: { },
                    actionTitle: "Get Started"
                )
                
                EmptyStateView(
                    title: "No meals logged yet",
                    subtitle: "Start tracking your nutrition by scanning or adding your first meal",
                    icon: "fork.knife.circle",
                    actionTitle: "Add Meal",
                    action: { }
                )
                .frame(height: 300)
            }
            .padding()
        }
        .background(Color.black)
        .coordinateSpace(name: "pullToRefresh")
    }
}
#endif
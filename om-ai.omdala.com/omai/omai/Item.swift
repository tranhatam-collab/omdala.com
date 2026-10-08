//
//  Item.swift
//  omai
//
//  Created by TRẦN HÀ TÂM on 27/4/26.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}

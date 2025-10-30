# Vibe Codebook - Usage Examples

## Basic JavaScript Execution

### Cell [1] - Simple Math
```javascript
2 + 2
```
**Output:** `4`

### Cell [2] - Variables Persist Across Cells
```javascript
const x = 10
const y = 20
```

### Cell [3] - Use Variables from Previous Cells
```javascript
x + y
```
**Output:** `30`

### Cell [4] - Complex Calculations
```javascript
const sum = x + y
const product = x * y
console.log(`Sum: ${sum}`)
console.log(`Product: ${product}`)
```
**Output:**
```
Sum: 30
Product: 200
```

## Working with Arrays and Objects

### Cell [5] - Create Data
```javascript
const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 },
  { name: 'Charlie', age: 35 }
]
```

### Cell [6] - Process Data
```javascript
const names = users.map(u => u.name)
const averageAge = users.reduce((sum, u) => sum + u.age, 0) / users.length
console.log('Names:', names)
console.log('Average Age:', averageAge)
```

## Data Visualization

### Cell [7] - Line Chart
```javascript
const salesData = [
  { month: 'Jan', revenue: 4000 },
  { month: 'Feb', revenue: 3000 },
  { month: 'Mar', revenue: 5000 },
  { month: 'Apr', revenue: 4500 },
  { month: 'May', revenue: 6000 },
  { month: 'Jun', revenue: 5500 }
]

lineChart(salesData, 'month', 'revenue', 'Monthly Revenue')
```
**Output:** Beautiful line chart showing revenue trend

### Cell [8] - Bar Chart
```javascript
const productSales = [
  { product: 'Laptops', sales: 120 },
  { product: 'Phones', sales: 250 },
  { product: 'Tablets', sales: 80 },
  { product: 'Accessories', sales: 300 }
]

barChart(productSales, 'product', 'sales', 'Product Sales Comparison')
```
**Output:** Bar chart comparing product sales

### Cell [9] - Area Chart
```javascript
const trafficData = [
  { day: 'Mon', visitors: 1200 },
  { day: 'Tue', visitors: 1900 },
  { day: 'Wed', visitors: 1500 },
  { day: 'Thu', visitors: 2100 },
  { day: 'Fri', visitors: 2400 },
  { day: 'Sat', visitors: 1800 },
  { day: 'Sun', visitors: 1600 }
]

areaChart(trafficData, 'day', 'visitors', 'Weekly Website Traffic')
```
**Output:** Area chart showing traffic flow

### Cell [10] - Pie Chart
```javascript
const marketShare = [
  { browser: 'Chrome', share: 65 },
  { browser: 'Safari', share: 18 },
  { browser: 'Firefox', share: 10 },
  { browser: 'Edge', share: 5 },
  { browser: 'Other', share: 2 }
]

pieChart(marketShare, 'browser', 'share', 'Browser Market Share')
```
**Output:** Pie chart showing market distribution

## Advanced Examples

### Cell [11] - Generate and Visualize Data
```javascript
// Generate random data
const dataPoints = []
for (let i = 0; i < 10; i++) {
  dataPoints.push({
    x: i,
    y: Math.floor(Math.random() * 100)
  })
}

lineChart(dataPoints, 'x', 'y', 'Random Data Points')
```

### Cell [12] - Statistical Calculations
```javascript
const numbers = [23, 45, 12, 67, 34, 89, 56, 78, 90, 123]

const mean = numbers.reduce((a, b) => a + b) / numbers.length
const sorted = [...numbers].sort((a, b) => a - b)
const median = sorted[Math.floor(sorted.length / 2)]
const max = Math.max(...numbers)
const min = Math.min(...numbers)

console.log(`Mean: ${mean}`)
console.log(`Median: ${median}`)
console.log(`Max: ${max}`)
console.log(`Min: ${min}`)
```

### Cell [13] - Data Transformation
```javascript
// Transform and aggregate data
const rawData = [
  { category: 'A', value: 10 },
  { category: 'B', value: 20 },
  { category: 'A', value: 15 },
  { category: 'B', value: 25 },
  { category: 'C', value: 30 }
]

const aggregated = rawData.reduce((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + item.value
  return acc
}, {})

const chartData = Object.entries(aggregated).map(([category, value]) => ({
  category,
  value
}))

barChart(chartData, 'category', 'value', 'Aggregated Categories')
```

## Tips

1. **Variables persist within a tab** - Define a variable in cell [1] and use it in cell [10]
2. **Each tab has its own context** - Variables in Tab 1 don't affect Tab 2
3. **Use console.log()** for debugging
4. **Charts update automatically** when you re-run cells
5. **Click the Run button** or use keyboard shortcuts to execute cells

## Available Chart Functions

- `lineChart(data, xKey, yKey, title?)` - Line chart
- `barChart(data, xKey, yKey, title?)` - Bar chart
- `areaChart(data, xKey, yKey, title?)` - Area chart
- `pieChart(data, nameKey, valueKey, title?)` - Pie chart

All charts expect:
- `data`: Array of objects
- `xKey/nameKey`: Property name for x-axis/labels
- `yKey/valueKey`: Property name for values
- `title`: Optional chart title

// Implementasi algoritma Least Square untuk prediksi trend
export class LeastSquarePredictor {
  constructor(data) {
    this.data = data || [];
  }

  // Menghitung prediksi menggunakan Linear Regression (Least Square)
  predict(predictionPeriods = 30) {
    if (this.data.length === 0) {
      return {
        predictions: [],
        trend: 'insufficient_data',
        slope: 0,
        intercept: 0,
        correlation: 0,
        calculationTable: [],
        summaryTable: {}
      };
    }
    
    // Handle single data point case
    if (this.data.length === 1) {
      const singleValue = Number(this.data[0].value) || 0;
      const predictions = [];
      
      // For single data point, assume flat trend (same value)
      for (let i = 1; i <= predictionPeriods; i++) {
        predictions.push({
          period: i + 1,
          date: this.getDateForPeriod(i + 1),
          value: Math.max(0, Math.round(singleValue)),
          type: 'prediction'
        });
      }
      
      return {
        predictions,
        trend: 'stable',
        slope: 0,
        intercept: singleValue,
        correlation: 0,
        accuracy: 'very_low',
        calculationTable: [{
          no: 1,
          week: 'Minggu 1',
          periode: 0,
          penjualan: singleValue,
          x2: 0,
          xy: 0
        }],
        summaryTable: {
          x: 0,
          y: singleValue,
          xy: 0,
          x2: 0,
          n: 1,
          slope: 0,
          intercept: singleValue,
          correlation: 0
        }
      };
    }

    const n = this.data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    // Prepare calculation table data
    const calculationTable = [];

    // Generate period values based on data length
    // For odd data length: use intervals of 1 (e.g., -2, -1, 0, 1, 2)
    // For even data length: use intervals of 2 (e.g., -4, -2, 0, 2, 4)
    const generatePeriods = (dataLength) => {
      const periods = [];
      if (dataLength % 2 === 1) {
        // Odd length: interval = 1, centered at 0
        const center = Math.floor(dataLength / 2);
        for (let i = 0; i < dataLength; i++) {
          periods.push(i - center);
        }
      } else {
        // Even length: interval = 2, centered at 0
        const center = dataLength / 2;
        for (let i = 0; i < dataLength; i++) {
          periods.push((i - center + 0.5) * 2);
        }
      }
      return periods;
    };

    const periods = generatePeriods(n);

    // Menghitung nilai-nilai yang diperlukan untuk least square
    this.data.forEach((point, index) => {
      const x = periods[index]; // Time period with new logic
      const y = Number(point.value) || 0; // Ensure y is a valid number
      const xy = x * y;
      const x2 = x * x;
      
      calculationTable.push({
        no: index + 1,
        week: `Minggu ${index + 1}`,
        periode: x,
        penjualan: y,
        x2: x2,
        xy: xy
      });
      
      sumX += x;
      sumY += y;
      sumXY += xy;
      sumX2 += x2;
      sumY2 += y * y;
    });

    // Menghitung slope (m) dan intercept (b) dari persamaan y = mx + b
    const denomSlope = (n * sumX2 - sumX * sumX);
    const slope = denomSlope !== 0 ? (n * sumXY - sumX * sumY) / denomSlope : 0;
    const intercept = n !== 0 ? (sumY - slope * sumX) / n : 0;

    // Menghitung korelasi (r)
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const correlation = denominator !== 0 ? numerator / denominator : 0;

    // Menentukan trend
    let trend = 'stable';
    if (slope > 0.1) trend = 'increasing';
    else if (slope < -0.1) trend = 'decreasing';

    // Membuat prediksi untuk periode ke depan
    const predictions = [];
    const lastPeriod = periods[periods.length - 1];
    const intervalStep = n % 2 === 1 ? 1 : 2; // Use same interval as data
    
    for (let i = 1; i <= predictionPeriods; i++) {
      const nextPeriod = lastPeriod + (i * intervalStep);
      const predictedValue = Math.max(0, Math.round(slope * nextPeriod + intercept));
      
      predictions.push({
        period: nextPeriod,
        date: this.getDateForPeriod(n + i),
        value: predictedValue,
        type: 'prediction'
      });
    }

    // Prepare summary table with proper number formatting
    const summaryTable = {
      x: sumX || 0,
      y: sumY || 0,
      xy: sumXY || 0,
      x2: sumX2 || 0,
      n: n || 0,
      slope: parseFloat((isFinite(slope) ? slope : 0).toFixed(4)),
      intercept: parseFloat((isFinite(intercept) ? intercept : 0).toFixed(4)),
      correlation: parseFloat((isFinite(correlation) ? correlation : 0).toFixed(4))
    };

    return {
      predictions,
      trend,
      slope: parseFloat((isFinite(slope) ? slope : 0).toFixed(4)),
      intercept: parseFloat((isFinite(intercept) ? intercept : 0).toFixed(4)),
      correlation: parseFloat((isFinite(correlation) ? correlation : 0).toFixed(4)),
      accuracy: this.calculateAccuracy(correlation),
      calculationTable,
      summaryTable
    };
  }

  // Menghitung akurasi berdasarkan korelasi
  calculateAccuracy(correlation) {
    const absCorrelation = Math.abs(correlation);
    if (absCorrelation >= 0.9) return 'very_high';
    if (absCorrelation >= 0.7) return 'high';
    if (absCorrelation >= 0.5) return 'medium';
    if (absCorrelation >= 0.3) return 'low';
    return 'very_low';
  }

  // Generate tanggal untuk periode prediksi
  getDateForPeriod(period) {
    const today = new Date();
    const futureDate = new Date(today.getTime() + (period - this.data.length) * 24 * 60 * 60 * 1000);
    return futureDate.toISOString().split('T')[0];
  }

  // Menghitung rekomendasi pengadaan
  getRecommendation(currentStock, minStock, maxStock) {
    const prediction = this.predict(30);
    
    if (prediction.predictions.length === 0) {
      return {
        action: 'monitor',
        quantity: 0,
        reason: 'Insufficient historical data'
      };
    }

    const avgPredictedDemand = prediction.predictions.slice(0, 7).reduce((sum, p) => sum + p.value, 0) / 7;
    const weeklyDemand = Math.max(1, avgPredictedDemand);
    
    // Safety stock calculation
    const safetyStock = Math.ceil(weeklyDemand * 0.5);
    const reorderPoint = weeklyDemand + safetyStock;
    
    if (currentStock <= reorderPoint) {
      const recommendedQty = Math.min(maxStock - currentStock, weeklyDemand * 4);
      return {
        action: 'order',
        quantity: Math.ceil(recommendedQty),
        reason: `Stock below reorder point. Predicted weekly demand: ${Math.ceil(weeklyDemand)} units`,
        urgency: currentStock <= minStock ? 'high' : 'medium'
      };
    }

    return {
      action: 'monitor',
      quantity: 0,
      reason: 'Stock level is adequate',
      urgency: 'low'
    };
  }
}
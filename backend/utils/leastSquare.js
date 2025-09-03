// Implementasi algoritma Least Square untuk prediksi trend
export class LeastSquarePredictor {
  constructor(data) {
    this.data = data || [];
  }

  // Menghitung prediksi menggunakan Linear Regression (Least Square)
  predict(periods = 30) {
    if (this.data.length < 2) {
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

    const n = this.data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    // Prepare calculation table data
    const calculationTable = [];

    // Menghitung nilai-nilai yang diperlukan untuk least square
    this.data.forEach((point, index) => {
      const x = index + 1; // Time period
      const y = point.value;
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
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

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
    for (let i = 1; i <= periods; i++) {
      const nextPeriod = n + i;
      const predictedValue = Math.max(0, Math.round(slope * nextPeriod + intercept));
      
      predictions.push({
        period: nextPeriod,
        date: this.getDateForPeriod(nextPeriod),
        value: predictedValue,
        type: 'prediction'
      });
    }

    // Prepare summary table
    const summaryTable = {
      x: parseFloat(sumX.toFixed(2)),
      y: parseFloat(sumY.toFixed(2)),
      xy: parseFloat(sumXY.toFixed(2)),
      x2: parseFloat(sumX2.toFixed(2)),
      n: n,
      slope: parseFloat(slope.toFixed(4)),
      intercept: parseFloat(intercept.toFixed(4)),
      correlation: parseFloat(correlation.toFixed(4))
    };

    return {
      predictions,
      trend,
      slope: parseFloat(slope.toFixed(4)),
      intercept: parseFloat(intercept.toFixed(4)),
      correlation: parseFloat(correlation.toFixed(4)),
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
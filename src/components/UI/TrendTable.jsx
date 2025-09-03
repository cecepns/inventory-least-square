import React from 'react';
import Card from './Card';
import Table from './Table';

const TrendTable = ({ data, loading = false }) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Card>
    );
  }

  if (!data || !data.analysis || !data.analysis.calculationTable) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Tabel Trend Least Square Mingguan
        </h3>
        <p className="text-gray-500">Data tidak tersedia</p>
      </Card>
    );
  }

  const { analysis, trend, accuracy } = data;
  const { calculationTable, summaryTable } = analysis;

  const formatNumber = (num) => {
    if (typeof num === 'string') return num;
    return Number(num).toLocaleString('id-ID');
  };

  const getTrendColor = (trendType) => {
    switch (trendType) {
      case 'increasing':
        return 'text-green-600 bg-green-100';
      case 'decreasing':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getTrendText = (trendType) => {
    switch (trendType) {
      case 'increasing':
        return 'Meningkat';
      case 'decreasing':
        return 'Menurun';
      default:
        return 'Stabil';
    }
  };

  const getAccuracyText = (accuracyLevel) => {
    switch (accuracyLevel) {
      case 'very_high':
        return 'Sangat Tinggi';
      case 'high':
        return 'Tinggi';
      case 'medium':
        return 'Sedang';
      case 'low':
        return 'Rendah';
      default:
        return 'Sangat Rendah';
    }
  };

  const getAccuracyColor = (accuracyLevel) => {
    switch (accuracyLevel) {
      case 'very_high':
        return 'text-green-700 bg-green-100';
      case 'high':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-red-600 bg-red-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with trend and accuracy indicators */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Tabel Trend Least Square Mingguan
          </h3>
          <div className="flex space-x-4">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getTrendColor(trend)}`}>
              Trend: {getTrendText(trend)}
            </span>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getAccuracyColor(accuracy)}`}>
              Akurasi: {getAccuracyText(accuracy)}
            </span>
          </div>
        </div>

        {/* Calculation Table */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Tabel Perhitungan</h4>
          <Table className="text-sm">
            <Table.Header>
              <Table.Row>
                <Table.Cell header>No</Table.Cell>
                <Table.Cell header>Minggu</Table.Cell>
                <Table.Cell header>Periode (X)</Table.Cell>
                <Table.Cell header>Penjualan (Y)</Table.Cell>
                <Table.Cell header>X²</Table.Cell>
                <Table.Cell header>XY</Table.Cell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {calculationTable.map((row, index) => (
                <Table.Row 
                  key={index} 
                  className={row.no === 'Total' ? 'bg-gray-50 font-semibold border-t-2' : ''}
                >
                  <Table.Cell>{row.no}</Table.Cell>
                  <Table.Cell>{row.week}</Table.Cell>
                  <Table.Cell>{formatNumber(row.periode)}</Table.Cell>
                  <Table.Cell>{formatNumber(row.penjualan)}</Table.Cell>
                  <Table.Cell>{formatNumber(row.x2)}</Table.Cell>
                  <Table.Cell>{formatNumber(row.xy)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>

        {/* Summary and Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summary Values */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Ringkasan Perhitungan</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Jumlah data (n):</span>
                <span className="font-medium">{summaryTable.n}</span>
              </div>
              <div className="flex justify-between">
                <span>Σx:</span>
                <span className="font-medium">{formatNumber(summaryTable.x)}</span>
              </div>
              <div className="flex justify-between">
                <span>Σy:</span>
                <span className="font-medium">{formatNumber(summaryTable.y)}</span>
              </div>
              <div className="flex justify-between">
                <span>Σxy:</span>
                <span className="font-medium">{formatNumber(summaryTable.xy)}</span>
              </div>
              <div className="flex justify-between">
                <span>Σx²:</span>
                <span className="font-medium">{formatNumber(summaryTable.x2)}</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Hasil Analisis</h4>
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Slope (a):</span>
                <span className="font-medium">{summaryTable.slope}</span>
              </div>
              <div className="flex justify-between">
                <span>Intercept (b):</span>
                <span className="font-medium">{summaryTable.intercept}</span>
              </div>
              <div className="flex justify-between">
                <span>Korelasi (r):</span>
                <span className="font-medium">{summaryTable.correlation}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-blue-700 font-medium">
                  Persamaan: Y = {summaryTable.slope}x + {summaryTable.intercept}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction for next weeks */}
        {analysis.predictions && analysis.predictions.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-800 mb-3">Prediksi Minggu Mendatang</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analysis.predictions.slice(0, 4).map((prediction, index) => (
                <div key={index} className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Minggu {prediction.period}</div>
                  <div className="text-lg font-semibold text-green-700">
                    {formatNumber(prediction.value)}
                  </div>
                  <div className="text-xs text-gray-500">unit</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TrendTable;

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { TokenState } from '../lib/bondingCurve';

interface TokenCandleChartProps {
  token: TokenState | null;
  className?: string;
}

export function TokenCandleChart({ token, className = '' }: TokenCandleChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('15m');
  const [isChartReady, setIsChartReady] = useState(false);

  // Generate mock candle data based on token
  const generateMockData = (token: TokenState, timeframe: string): CandlestickData[] => {
    if (!token) return [];

    const now = new Date();
    const data: CandlestickData[] = [];
    const basePrice = token.currentPrice;
    const volatility = 0.05; // 5% volatility
    
    // Number of candles based on timeframe
    let numCandles = 50;
    let timeIncrement = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    switch (timeframe) {
      case '1m':
        numCandles = 60;
        timeIncrement = 60 * 1000;
        break;
      case '5m':
        numCandles = 60;
        timeIncrement = 5 * 60 * 1000;
        break;
      case '15m':
        numCandles = 50;
        timeIncrement = 15 * 60 * 1000;
        break;
      case '1h':
        numCandles = 48;
        timeIncrement = 60 * 60 * 1000;
        break;
      case '4h':
        numCandles = 30;
        timeIncrement = 4 * 60 * 60 * 1000;
        break;
      case '1d':
        numCandles = 30;
        timeIncrement = 24 * 60 * 60 * 1000;
        break;
    }
    
    let lastPrice = basePrice * 0.8; // Start a bit lower to show uptrend
    
    for (let i = 0; i < numCandles; i++) {
      const time = new Date(now.getTime() - (numCandles - i) * timeIncrement);
      
      // Generate random price movement with slight uptrend bias
      const changePercent = (Math.random() - 0.45) * volatility;
      const range = lastPrice * volatility;
      
      const open = lastPrice;
      const close = lastPrice * (1 + changePercent);
      const high = Math.max(open, close) + (Math.random() * range * 0.5);
      const low = Math.min(open, close) - (Math.random() * range * 0.5);
      
      // Ensure we don't go below zero
      const safeHigh = Math.max(high, low * 1.001);
      const safeLow = Math.max(low, 0.00000001);
      const safeClose = Math.max(close, safeLow);
      
      data.push({
        time: time.getTime() / 1000,
        open,
        high: safeHigh,
        low: safeLow,
        close: safeClose
      });
      
      lastPrice = safeClose;
    }
    
    return data;
  };

  // Generate mock volume data
  const generateVolumeData = (candleData: CandlestickData[]) => {
    return candleData.map(candle => ({
      time: candle.time,
      value: Math.random() * 100 * (candle.close > candle.open ? 1 : 0.7),
      color: candle.close > candle.open ? 'rgba(0, 150, 136, 0.5)' : 'rgba(255, 82, 82, 0.5)'
    }));
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'rgba(0, 0, 0, 0.0)' },
        textColor: 'rgba(34, 197, 94, 0.9)',
      },
      grid: {
        vertLines: { color: 'rgba(34, 197, 94, 0.1)' },
        horzLines: { color: 'rgba(34, 197, 94, 0.1)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(34, 197, 94, 0.3)',
      },
      rightPriceScale: {
        borderColor: 'rgba(34, 197, 94, 0.3)',
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: 'rgba(34, 197, 94, 0.5)',
          width: 1,
          style: 1,
          labelBackgroundColor: 'rgba(34, 197, 94, 0.8)',
        },
        horzLine: {
          color: 'rgba(34, 197, 94, 0.5)',
          width: 1,
          style: 1,
          labelBackgroundColor: 'rgba(34, 197, 94, 0.8)',
        },
      },
    });

    // Add series
    const candleSeries = chart.addCandlestickSeries({
      upColor: 'rgba(0, 150, 136, 1)',
      downColor: 'rgba(255, 82, 82, 1)',
      borderVisible: false,
      wickUpColor: 'rgba(0, 150, 136, 1)',
      wickDownColor: 'rgba(255, 82, 82, 1)',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: 'rgba(34, 197, 94, 0.5)',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Store references
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    setIsChartReady(true);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
        setIsChartReady(false);
      }
    };
  }, []);

  // Update chart data when token or timeframe changes
  useEffect(() => {
    if (!isChartReady || !token || !chartRef.current || !candleSeriesRef.current || !volumeSeriesRef.current) return;

    try {
      // Generate data
      const candleData = generateMockData(token, timeframe);
      const volumeData = generateVolumeData(candleData);
      
      // Update series data
      candleSeriesRef.current.setData(candleData);
      volumeSeriesRef.current.setData(volumeData);
      
      // Fit content
      chartRef.current.timeScale().fitContent();
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }, [token, timeframe, isChartReady]);

  const handleTimeframeChange = (newTimeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d') => {
    setTimeframe(newTimeframe);
  };

  if (!token) {
    return (
      <div className={`flex items-center justify-center h-[400px] border border-green-500/30 rounded-lg bg-black/30 ${className}`}>
        <p className="text-green-500/50">Select a token to view chart</p>
      </div>
    );
  }

  return (
    <div className={`border border-green-500/30 rounded-lg bg-black/30 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-green-400">
          {token.symbol} Price Chart
        </h3>
        <div className="flex items-center gap-1 text-xs">
          {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeframeChange(tf)}
              className={`px-2 py-1 rounded ${
                timeframe === tf
                  ? 'bg-green-500 text-black font-medium'
                  : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div className="text-sm text-green-500/75 mb-2">
        <div className="flex items-center justify-between">
          <div>Current: {token.currentPrice.toFixed(6)} SOL</div>
          <div>
            24h Change: <span className="text-green-400">+{(Math.random() * 10).toFixed(2)}%</span>
          </div>
        </div>
      </div>
      
      <div ref={chartContainerRef} className="h-[400px] w-full" />
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-green-500/75">
        <div>
          <div className="text-green-500/50">24h High</div>
          <div className="text-green-400">{(token.currentPrice * (1 + Math.random() * 0.1)).toFixed(6)} SOL</div>
        </div>
        <div>
          <div className="text-green-500/50">24h Low</div>
          <div className="text-green-400">{(token.currentPrice * (1 - Math.random() * 0.05)).toFixed(6)} SOL</div>
        </div>
        <div>
          <div className="text-green-500/50">24h Volume</div>
          <div className="text-green-400">{(token.reserveBalance * (Math.random() * 5 + 2)).toFixed(2)} SOL</div>
        </div>
      </div>
    </div>
  );
}
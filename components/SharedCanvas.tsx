import React, { useRef, useEffect, useState } from 'react';
import { socketService } from '../services/mockSocket';
import { DrawLineData, Point, DrawingTool, BRUSH_COLORS } from '../types';
import { Eraser, Brush, RotateCcw, X, Palette } from 'lucide-react';

interface SharedCanvasProps {
  isActive: boolean;
  onClose?: () => void;
}

const SharedCanvas: React.FC<SharedCanvasProps> = ({ isActive, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState<string>(BRUSH_COLORS[0]);
  const [tool, setTool] = useState<DrawingTool>('BRUSH');
  const [lineWidth, setLineWidth] = useState<number>(4);
  
  const prevPointRef = useRef<Point | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const context = canvas.getContext('2d');
      if (context) {
        context.scale(dpr, dpr);
        context.lineCap = 'round';
        context.lineJoin = 'round';
        setCtx(context);
      }
    }
  }, [isActive]);

  useEffect(() => {
    const handleRemoteDraw = (data: DrawLineData) => {
      if (!ctx) return;
      drawLine(data.prevPoint, data.currentPoint, data.color, data.width);
    };
    socketService.on('DRAW_LINE', handleRemoteDraw);
    return () => {
      socketService.off('DRAW_LINE', handleRemoteDraw);
    };
  }, [ctx]);

  const drawLine = (start: Point | null, end: Point, strokeStyle: string, width: number) => {
    if (!ctx) return;
    start = start ?? end;
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.strokeStyle = strokeStyle;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isActive) return;
    setIsDrawing(true);
    const point = getCanvasPoint(e);
    if (point) prevPointRef.current = point;
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx || !isActive) return;
    e.preventDefault();
    const currentPoint = getCanvasPoint(e);
    if (!currentPoint) return;
    const drawColor = tool === 'ERASER' ? '#FFFFFF' : color;
    const drawWidth = tool === 'ERASER' ? 20 : lineWidth;
    drawLine(prevPointRef.current, currentPoint, drawColor, drawWidth);
    const drawData: DrawLineData = {
      prevPoint: prevPointRef.current,
      currentPoint,
      color: drawColor,
      width: drawWidth,
    };
    socketService.emit('DRAW_LINE', drawData);
    prevPointRef.current = currentPoint;
  };

  const handleEnd = () => {
    setIsDrawing(false);
    prevPointRef.current = null;
  };

  const clearCanvas = () => {
    if (canvasRef.current && ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      {/* Floating Glass Toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center gap-3 z-10">
        
        <div className="flex bg-white/10 rounded-xl p-1">
            <button
                onClick={() => setTool('BRUSH')}
                className={`p-2 rounded-lg transition-all ${tool === 'BRUSH' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
                <Brush size={18} />
            </button>
            <button
                onClick={() => setTool('ERASER')}
                className={`p-2 rounded-lg transition-all ${tool === 'ERASER' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
                <Eraser size={18} />
            </button>
        </div>

        <div className="w-px h-6 bg-white/20"></div>
        
        <div className="flex gap-1.5 px-2">
            {BRUSH_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool('BRUSH'); }}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c && tool === 'BRUSH' ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
        </div>

        <div className="w-px h-6 bg-white/20"></div>

        <button onClick={clearCanvas} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <RotateCcw size={18} />
        </button>

        {onClose && (
            <button onClick={onClose} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                <X size={18} />
            </button>
        )}
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        {!isActive && (
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
             <div className="bg-black/80 p-6 rounded-2xl border border-white/10 text-center shadow-2xl">
                <Palette size={32} className="text-violet-500 mx-auto mb-3" />
                <p className="text-gray-300 font-medium">Drawing will be enabled when matched.</p>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default SharedCanvas;
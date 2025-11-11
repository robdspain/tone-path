import React, { useState } from 'react';
import './CircleOfFifths.css';

interface Key {
  major: string;
  minor: string;
  angle: number;
}

const CircleOfFifths: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Circle of 5ths data - arranged clockwise starting from C at top
  const keys: Key[] = [
    { major: 'C', minor: 'a', angle: 0 },
    { major: 'G', minor: 'e', angle: 30 },
    { major: 'D', minor: 'b', angle: 60 },
    { major: 'A', minor: 'f#', angle: 90 },
    { major: 'E', minor: 'c#', angle: 120 },
    { major: 'B', minor: 'g#', angle: 150 },
    { major: 'Gb', minor: 'eb', angle: 180 },
    { major: 'Db', minor: 'bb', angle: 210 },
    { major: 'Ab', minor: 'f', angle: 240 },
    { major: 'Eb', minor: 'c', angle: 270 },
    { major: 'Bb', minor: 'g', angle: 300 },
    { major: 'F', minor: 'd', angle: 330 },
  ];

  const centerX = 200;
  const centerY = 200;
  const outerRadius = 180;
  const innerRadius = 120;
  const centerRadius = 20;

  const getKeyPosition = (angle: number, radius: number) => {
    const radian = ((angle - 90) * Math.PI) / 180; // -90 to start at top
    return {
      x: centerX + radius * Math.cos(radian),
      y: centerY + radius * Math.sin(radian),
    };
  };

  const handleKeyClick = (key: string) => {
    setSelectedKey(key === selectedKey ? null : key);
  };

  // Calculate gradient colors based on angle (teal on left, darker blue on right)
  const getSegmentGradient = (angle: number, opacity: number = 1) => {
    // Normalize angle to 0-360
    const normalizedAngle = ((angle % 360) + 360) % 360;
    // Map angle to gradient: left side (270°) = teal, right side (90°) = dark blue
    const progress = (normalizedAngle + 90) % 360 / 360;
    
    // Create gradient from teal (left) to dark blue (right)
    const tealColor = { r: 32, g: 178, b: 170 }; // #20B2AA
    const darkBlueColor = { r: 0, g: 0, b: 139 }; // #00008B
    
    const r = Math.round(tealColor.r + (darkBlueColor.r - tealColor.r) * progress);
    const g = Math.round(tealColor.g + (darkBlueColor.g - tealColor.g) * progress);
    const b = Math.round(tealColor.b + (darkBlueColor.b - tealColor.b) * progress);
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <div className="circle-of-fifths-container">
      <svg
        width="400"
        height="400"
        viewBox="0 0 400 400"
        className="circle-of-fifths-svg"
      >
        <defs>
          {/* Create unique gradients for each segment */}
          {keys.map((key, index) => {
            const lighterColor = getSegmentGradient(key.angle, 0.6);
            const darkerColor = getSegmentGradient(key.angle, 0.3);
            
            return (
              <linearGradient
                key={`segmentGrad-${index}`}
                id={`segmentGradient-${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={lighterColor} />
                <stop offset="100%" stopColor={darkerColor} />
              </linearGradient>
            );
          })}
        </defs>

        {/* Outer circle segments */}
        {keys.map((key, index) => {
          const startAngle = key.angle - 15;
          const endAngle = key.angle + 15;
          const startRadian = ((startAngle - 90) * Math.PI) / 180;
          const endRadian = ((endAngle - 90) * Math.PI) / 180;

          const x1 = centerX + outerRadius * Math.cos(startRadian);
          const y1 = centerY + outerRadius * Math.sin(startRadian);
          const x2 = centerX + outerRadius * Math.cos(endRadian);
          const y2 = centerY + outerRadius * Math.sin(endRadian);

          const largeArcFlag = 30 > 180 ? 1 : 0;

          return (
            <g key={`segment-${index}`}>
              {/* Segment path */}
              <path
                d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={`url(#segmentGradient-${index})`}
                stroke="rgba(30, 58, 138, 0.5)"
                strokeWidth="1.5"
                className="segment-path"
                onClick={() => handleKeyClick(key.major)}
              />
            </g>
          );
        })}

        {/* Inner circle segments */}
        {keys.map((key, index) => {
          const startAngle = key.angle - 15;
          const endAngle = key.angle + 15;
          const startRadian = ((startAngle - 90) * Math.PI) / 180;
          const endRadian = ((endAngle - 90) * Math.PI) / 180;

          const x1 = centerX + innerRadius * Math.cos(startRadian);
          const y1 = centerY + innerRadius * Math.sin(startRadian);
          const x2 = centerX + innerRadius * Math.cos(endRadian);
          const y2 = centerY + innerRadius * Math.sin(endRadian);

          const largeArcFlag = 30 > 180 ? 1 : 0;
          const innerColor = getSegmentGradient(key.angle, 0.25);

          return (
            <g key={`inner-segment-${index}`}>
              <path
                d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={innerColor}
                stroke="rgba(30, 58, 138, 0.4)"
                strokeWidth="1"
                className="inner-segment-path"
                onClick={() => handleKeyClick(key.minor)}
              />
            </g>
          );
        })}

        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={centerRadius}
          fill="#1E3A8A"
          className="center-circle"
        />

        {/* Major keys (outer ring) */}
        {keys.map((key, index) => {
          const pos = getKeyPosition(key.angle, outerRadius - 25);
          return (
            <text
              key={`major-${index}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`major-key ${selectedKey === key.major ? 'selected' : ''}`}
              onClick={() => handleKeyClick(key.major)}
              style={{ cursor: 'pointer', fontSize: '24px', fill: '#FFFFFF', fontWeight: 'bold' }}
            >
              {key.major}
            </text>
          );
        })}

        {/* Minor keys (inner ring) */}
        {keys.map((key, index) => {
          const pos = getKeyPosition(key.angle, innerRadius - 15);
          return (
            <text
              key={`minor-${index}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`minor-key ${selectedKey === key.minor ? 'selected' : ''}`}
              onClick={() => handleKeyClick(key.minor)}
              style={{ cursor: 'pointer', fontSize: '18px', fill: '#FFFFFF' }}
            >
              {key.minor}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default CircleOfFifths;


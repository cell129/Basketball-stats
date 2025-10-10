import React from 'react';

// Icon Definitions
const IconBasketball = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.5 9a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2a.5.5 0 01-.5-.5zM12 11a.5.5 0 00-.5.5v2a.5.5 0 001 0v-2a.5.5 0 00-.5-.5zm-3.5-3a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5zM10 5a.5.5 0 00-.5.5v2a.5.5 0 001 0V5.5A.5.5 0 0010 5zM15 9.5a.5.5 0 00-.5-.5h-2a.5.5 0 000 1h2a.5.5 0 00.5-.5z" clipRule="evenodd" />
    </svg>
);
const IconAssist = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
);
const IconSteal = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8.433 7.418c.158-.103.346-.196.552-.278l.48-.184c.433-.165.912-.249 1.41-.249.256 0 .506.038.748.112l.48.146c.453.137.87.355 1.226.638l.1.085c.19.16.358.34.5.54l.48.69a.987.987 0 01.12.518V13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-.5a.5.5 0 00-.5-.5h-1a.5.5 0 00-.5.5V13a1 1 0 01-1 1H4a1 1 0 01-1-1V9.22c0-.238.07-.47.2-.676l.48-.736a1.004 1.004 0 01.518-.418l.48-.184A4.017 4.017 0 018.433 7.418zM12 11.5a.5.5 0 000-1h-1a.5.5 0 000 1h1z" />
    </svg>
);
const IconBlock = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.504 2.147C10.51 1 12.49 1 13.496 2.147l4.364 4.881c1.006 1.129.215 3.012-1.25 3.012h-2.11a3 3 0 01-2.996-3.004V8.16c0-.52-.168-1.018-.475-1.424l-1.042-1.39a.5.5 0 00-.814 0l-1.042 1.39c-.307.406-.475.903-.475 1.424v-.004a3 3 0 01-2.996 3.004H2.386c-1.465 0-2.256-1.883-1.25-3.012L5.504 2.147zM5 13.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5zM5 16.5a.5.5 0 01.5-.5h9a.5.5 0 010 1h-9a.5.5 0 01-.5-.5z" clipRule="evenodd" />
    </svg>
);
const IconTurnover = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.02-1.742 3.02H4.42c-1.532 0-2.492-1.686-1.742-3.02l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);
const IconRebound = (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V3.75A.75.75 0 0110 3zM3.25 10a.75.75 0 01.75-.75h12a.75.75 0 010 1.5h-12a.75.75 0 01-.75-.75z" clipRule="evenodd" />
        <path d="M13.28 3.22a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06-1.06L10 5.69l3.22-3.22a.75.75 0 011.06 0zM6.72 16.78a.75.75 0 010-1.06l3.5-3.5a.75.75 0 011.06 0l3.5 3.5a.75.75 0 11-1.06 1.06L10 14.31l-3.22 3.22a.75.75 0 01-1.06 0z" />
    </svg>
);
const IconFoul = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a1 1 0 011.707-.707l6.707 6.707a1 1 0 010 1.414l-1.707 1.707a1 1 0 11-1.414-1.414l.293-.293H8.5a3.5 3.5 0 110-7H9V4zM7 7.5a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
    </svg>
);

interface StatButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'success' | 'danger';
    className?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
}

const StatButton: React.FC<StatButtonProps> = ({ children, onClick, variant = 'default', className = '', icon, disabled }) => {
    const baseClasses = 'w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
    const variantClasses = {
        default: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
        success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    };
    return (
        <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} onClick={onClick} disabled={disabled}>
            {icon}
            <span>{children}</span>
        </button>
    );
}

interface StatControlsProps {
  onStatUpdate: (actionText: string, statChanges: Record<string, number>) => void;
  disabled: boolean;
}

const ControlSection: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
    <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
        <h3 className="text-lg font-bold mb-3 text-cyan-400">{title}</h3>
        <div className="grid grid-cols-2 gap-3">
            {children}
        </div>
    </div>
);


export const StatControls: React.FC<StatControlsProps> = ({ onStatUpdate, disabled }) => {
  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
        <div className="space-y-4">
            <ControlSection title="Shooting">
                <StatButton variant="success" icon={IconBasketball} onClick={() => onStatUpdate('2-Point Shot Made', { FGM: 1, FGA: 1 })}>2PT Made</StatButton>
                <StatButton variant="danger" icon={IconBasketball} onClick={() => onStatUpdate('2-Point Shot Missed', { FGA: 1 })}>2PT Miss</StatButton>
                <StatButton variant="success" icon={IconBasketball} onClick={() => onStatUpdate('3-Point Shot Made', { FGM: 1, FGA: 1, TPM: 1, TPA: 1 })}>3PT Made</StatButton>
                <StatButton variant="danger" icon={IconBasketball} onClick={() => onStatUpdate('3-Point Shot Missed', { FGA: 1, TPA: 1 })}>3PT Miss</StatButton>
                <StatButton variant="success" icon={IconBasketball} onClick={() => onStatUpdate('Free Throw Made', { FTM: 1, FTA: 1 })}>FT Made</StatButton>
                <StatButton variant="danger" icon={IconBasketball} onClick={() => onStatUpdate('Free Throw Missed', { FTA: 1 })}>FT Miss</StatButton>
            </ControlSection>

            <ControlSection title="Playmaking & Defense">
                <StatButton icon={IconAssist} onClick={() => onStatUpdate('Assist', { AST: 1 })}>Assist</StatButton>
                <StatButton icon={IconSteal} onClick={() => onStatUpdate('Steal', { STL: 1 })}>Steal</StatButton>
                <StatButton icon={IconBlock} onClick={() => onStatUpdate('Block', { BLK: 1 })}>Block</StatButton>
                <StatButton icon={IconTurnover} onClick={() => onStatUpdate('Turnover', { TOV: 1 })}>Turnover</StatButton>
            </ControlSection>

            <ControlSection title="Rebounding & Fouls">
                <StatButton icon={IconRebound} onClick={() => onStatUpdate('Offensive Rebound', { OREB: 1 })}>Off. Rebound</StatButton>
                <StatButton icon={IconRebound} onClick={() => onStatUpdate('Defensive Rebound', { DREB: 1 })}>Def. Rebound</StatButton>
                <StatButton icon={IconFoul} onClick={() => onStatUpdate('Personal Foul', { PF: 1 })}>Foul</StatButton>
            </ControlSection>
        </div>
    </div>
  );
};
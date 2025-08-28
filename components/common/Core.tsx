import React, { useState } from 'react';
import { PROBLEM_STATEMENTS } from '../../constants';
import { ProblemStatement } from '../../types';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'font-bold rounded-lg transition duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-indigo-700 shadow-lg shadow-primary/30',
    secondary: 'bg-secondary text-neutral-900 font-bold hover:bg-cyan-500',
    danger: 'bg-accent text-white hover:bg-rose-600',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-200',
  };

  const sizeStyles = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  contentClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, contentClassName = 'p-6' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 id="modal-title" className="text-xl font-bold text-neutral-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-800 transition"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className={`${contentClassName} flex-grow`}>
          {children}
        </div>
      </div>
    </div>
  );
};

// --- MultiSelect ---
interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onAddNewOption: (option: string) => void;
  placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  onAddNewOption,
  placeholder = "Select or add skills...",
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: string) => {
    if (!selected.includes(option)) {
      onChange([...selected, option]);
    }
    setInputValue('');
    setIsOpen(false);
  };

  const handleRemove = (option: string) => {
    onChange(selected.filter((item) => item !== option));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() !== '') {
        e.preventDefault();
        const newSkill = inputValue.trim();
        if(!options.includes(newSkill) && !selected.includes(newSkill)) {
            onAddNewOption(newSkill);
        }
        if(!selected.includes(newSkill)) {
            onChange([...selected, newSkill]);
        }
        setInputValue('');
    }
  };

  const filteredOptions = options.filter(
    (option) =>
      !selected.includes(option) &&
      option.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="border border-neutral-300 rounded-lg p-2 flex flex-wrap gap-2 items-center" onClick={() => setIsOpen(true)}>
        {selected.map((item) => (
          <div key={item} className="bg-primary text-white text-sm font-medium px-2 py-1 rounded-md flex items-center gap-2">
            {item}
            <button type="button" onClick={() => handleRemove(item)} className="font-bold">&times;</button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="outline-none flex-grow"
        />
      </div>
      {isOpen && (
        <ul className="absolute z-10 w-full bg-white border border-neutral-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li
                key={option}
                onClick={() => handleSelect(option)}
                className="px-4 py-2 hover:bg-neutral-100 cursor-pointer"
              >
                {option}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-neutral-500">
              {inputValue ? `Press Enter to add "${inputValue}"` : "No options found"}
            </li>
          )}
        </ul>
      )}
    </div>
  );
};


// --- ConfirmationModal ---
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div>
        <div className="text-neutral-600 mb-6">{message}</div>
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// --- ProblemStatementSelector ---
const ProblemStatementModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (problem: ProblemStatement) => void;
}> = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [viewingProblem, setViewingProblem] = useState<ProblemStatement | null>(null);

  const filteredStatements = PROBLEM_STATEMENTS.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.domain?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (problem: ProblemStatement) => {
    onSelect(problem);
    onClose();
  };

  const renderListView = () => (
    <div className="flex flex-col h-[60vh]">
      <input
        type="text"
        placeholder="Search by keyword, domain, or ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary mb-4"
      />
      <div className="flex-grow overflow-y-auto pr-2">
        {filteredStatements.length > 0 ? (
          <ul className="space-y-3">
            {filteredStatements.map(ps => (
              <li key={ps.id} className="p-3 border rounded-lg hover:bg-neutral-50">
                <h4 className="font-bold text-primary">{ps.title}</h4>
                <p className="text-sm text-neutral-600"><strong>ID:</strong> {ps.id} | <strong>Domain:</strong> {ps.domain || 'N/A'}</p>
                <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{ps.description}</p>
                <div className="text-right mt-2 space-x-2">
                   <Button size="sm" variant="ghost" onClick={() => setViewingProblem(ps)}>View</Button>
                   <Button size="sm" onClick={() => handleSelect(ps)}>Select</Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-500 text-center py-8">No problem statements found matching your search.</p>
        )}
      </div>
    </div>
  );
  
  const renderDetailView = () => {
      if (!viewingProblem) return null;
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-primary">{viewingProblem.title}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-600">
            {viewingProblem.domain && <span><strong>Domain:</strong> {viewingProblem.domain}</span>}
            {viewingProblem.category && <span><strong>Category:</strong> {viewingProblem.category}</span>}
            {viewingProblem.organization && <span><strong>Organization:</strong> {viewingProblem.organization}</span>}
          </div>
          <div className="prose prose-sm max-w-none max-h-[50vh] overflow-y-auto border-t border-b py-4">
            <p style={{ whiteSpace: 'pre-wrap' }}>{viewingProblem.description}</p>
          </div>
          <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={() => setViewingProblem(null)}>← Back to List</Button>
            <Button onClick={() => handleSelect(viewingProblem)}>Select this Problem</Button>
          </div>
        </div>
      );
  }
  
  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={viewingProblem ? `Details for ${viewingProblem.id}` : "Select SIH 2025 Problem Statement"}
    >
      {viewingProblem ? renderDetailView() : renderListView()}
    </Modal>
  );
};


export const ProblemStatementSelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
  id?: string;
}> = ({ value, onChange, id = "projectIdea" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleSelectProblem = (problem: ProblemStatement) => {
    const formattedText = `[${problem.id}] ${problem.title}\n\n${problem.description}`;
    onChange(formattedText);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-neutral-700">Your Epic Project Idea</label>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(true)}>
          Select from SIH 2025 List
        </Button>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Describe the awesome project you want to build, or select one from the SIH list."
        className="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        required
      />
      <ProblemStatementModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelect={handleSelectProblem} 
      />
    </div>
  );
};
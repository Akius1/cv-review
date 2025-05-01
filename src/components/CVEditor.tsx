/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";

interface CVEditorProps {
  cv: any;
  readOnly?: boolean;
  onSave?: (data: any) => void;
}

const CVEditor = ({ cv, readOnly = false, onSave }: CVEditorProps) => {
  const [sections, setSections] = useState<
    { title: string; content: string }[]
  >([
    { title: "Personal Information", content: "" },
    { title: "Education", content: "" },
    { title: "Work Experience", content: "" },
    { title: "Skills", content: "" },
    { title: "Additional Information", content: "" },
  ]);
  const [activeSection, setActiveSection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");

  // Simulate loading CV content
  useEffect(() => {
    if (cv) {
      // In a real app, you'd fetch the actual CV content from the server
      // For now, we'll simulate with placeholder content
      const mockCVData = {
        "Personal Information": `${cv.first_name} ${cv.last_name}\n${cv.email}\nPhone: +1 (123) 456-7890\nLocation: San Francisco, CA`,
        Education:
          "Bachelor of Science in Computer Science\nUniversity of California, Berkeley\n2018 - 2022",
        "Work Experience":
          "Software Engineer\nTech Solutions Inc.\nJanuary 2022 - Present\n\nJunior Developer\nStartup Innovations\nMay 2021 - December 2021",
        Skills:
          "JavaScript, React, Node.js, TypeScript, Next.js\nDatabase: PostgreSQL, MongoDB\nTools: Git, Docker, AWS",
        "Additional Information":
          "Languages: English (Native), Spanish (Intermediate)\nHobbies: Rock climbing, Photography, Chess",
      };

      // Update sections with mock data
      const updatedSections = sections.map((section) => ({
        title: section.title,
        content:
          mockCVData[section.title as keyof typeof mockCVData] ||
          section.content,
      }));

      setSections(updatedSections);
      setIsLoading(false);
    }
  }, [cv]);

  const handleContentChange = (index: number, content: string) => {
    const newSections = [...sections];
    newSections[index].content = content;
    setSections(newSections);
  };

  const handleSave = () => {
    if (onSave) {
      setSaveStatus("Saving...");

      // Convert sections to a structured CV object
      const cvData = sections.reduce((acc, section) => {
        acc[section.title.replace(/\s+/g, "_").toLowerCase()] = section.content;
        return acc;
      }, {} as Record<string, string>);

      // Simulate API call delay
      setTimeout(() => {
        onSave(cvData);
        setSaveStatus("Saved successfully!");

        // Clear status message after 2 seconds
        setTimeout(() => setSaveStatus(""), 2000);
      }, 1000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {sections.map((section, index) => (
          <button
            key={section.title}
            onClick={() => setActiveSection(index)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
              activeSection === index
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {sections.map((section, index) => (
          <div
            key={section.title}
            className={activeSection === index ? "block" : "hidden"}
          >
            <h3 className="text-lg font-medium mb-2">{section.title}</h3>
            <textarea
              value={section.content}
              onChange={(e) => handleContentChange(index, e.target.value)}
              readOnly={readOnly}
              rows={10}
              className={`w-full p-3 border border-gray-300 rounded-md font-mono text-sm ${
                readOnly
                  ? "bg-gray-50"
                  : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              }`}
            />
          </div>
        ))}

        {!readOnly && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
            {saveStatus && (
              <span className="ml-3 text-sm text-green-600 self-center">
                {saveStatus}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CVEditor;

import React, { useState } from "react";

export default function StepFlow() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      number: "01",
      color: "bg-[#19C1E4]",
      title: "Connect your source dashboard",
      description:
        "Select a Meraki region and enter your API key for the organization you want to migrate from. Supports Global, India, Canada, China, and custom endpoints.",
    },
    {
      id: 2,
      number: "02",
      color: "bg-[#3B7FF3]",
      title: "Connect your destination dashboard",
      description:
        "Configure the target region and API key. The wizard validates both connections before allowing you to proceed.",
    },
    {
      id: 3,
      number: "03",
      color: "bg-[#F45C48]",
      title: "Select devices and review",
      description:
        "Browse your source organization's inventory. Select the devices to migrate. The review screen shows a full summary before any change is made.",
    },
    {
      id: 4,
      number: "04",
      color: "bg-[#005857]",
      title: "Automatic pre-migration backup",
      description:
        "The platform snapshots your source organization — VLANs, firewall rules, SSIDs, RADIUS, group policies, RF profiles — and saves it as a ZIP file.",
    },
    {
      id: 5,
      number: "05",
      color: "bg-[#049FD9]",
      title: "Devices are migrated",
      description:
        "Devices are removed from the source network, unclaimed, claimed to the destination org, and added to the target network — with timed waits between stages for cloud propagation.",
    },
    {
      id: 6,
      number: "06",
      color: "bg-[#F45C48]",
      title: "Configurations restored automatically",
      description:
        "Device-level and network-level configs from the backup are pushed to the destination. Rollback is available at any stage if something goes wrong.",
    },
  ];

  return (
    <div className="flex flex-col items-center gap-12 w-full">
      {/* Step Flow Diagram - Fixed Width */}
      <div
        className="relative w-full max-w-[1200px]"
        style={{ height: "240px" }}
      >
        {/* Connecting Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        >
          {/* 01 to 02 */}
          <line
            x1="17%"
            y1="35%"
            x2="28%"
            y2="62%"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          {/* 02 to 03 */}
          <line
            x1="32%"
            y1="62%"
            x2="42%"
            y2="40%"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          {/* 03 to 04 */}
          <line
            x1="47%"
            y1="40%"
            x2="57%"
            y2="68%"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          {/* 04 to 05 */}
          <line
            x1="62%"
            y1="68%"
            x2="72%"
            y2="35%"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          {/* 05 to 06 */}
          <line
            x1="77%"
            y1="35%"
            x2="88%"
            y2="60%"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
        </svg>

        {/* Step 01 */}
        <button
          onClick={() => setActiveStep(1)}
          className={`absolute ${steps[0].color} text-white font-bold text-[30px] rounded-2xl shadow-lg hover:scale-102 transition-all duration-200 cursor-pointer flex items-center justify-center`}
          style={{
            top: "20px",
            left: "12%",
            width: "90px",
            height: "90px",
            zIndex: activeStep === 1 ? 20 : 10,
            transform: activeStep === 1 ? "scale(1.1)" : "scale(1)",
          }}
        >
          {steps[0].number}
        </button>

        {/* Step 02 */}
        <button
          onClick={() => setActiveStep(2)}
          className={`absolute ${steps[1].color} text-white font-bold text-[30px] rounded-2xl shadow-lg hover:scale-102 transition-all duration-200 cursor-pointer flex items-center justify-center`}
          style={{
            top: "110px",
            left: "25%",
            width: "90px",
            height: "90px",
            zIndex: activeStep === 2 ? 20 : 10,
            transform: activeStep === 2 ? "scale(1.1)" : "scale(1)",
          }}
        >
          {steps[1].number}
        </button>

        {/* Step 03 */}
        <button
          onClick={() => setActiveStep(3)}
          className={`absolute ${steps[2].color} text-white font-bold text-[30px] rounded-2xl shadow-lg hover:scale-102 transition-all duration-200 cursor-pointer flex items-center justify-center`}
          style={{
            top: "50px",
            left: "40%",
            width: "90px",
            height: "90px",
            zIndex: activeStep === 3 ? 20 : 10,
            transform: activeStep === 3 ? "scale(1.1)" : "scale(1)",
          }}
        >
          {steps[2].number}
        </button>

        {/* Step 04 */}
        <button
          onClick={() => setActiveStep(4)}
          className={`absolute ${steps[3].color} text-white font-bold text-[30px] rounded-2xl shadow-lg hover:scale-102 transition-all duration-200 cursor-pointer flex items-center justify-center`}
          style={{
            top: "130px",
            left: "55%",
            width: "90px",
            height: "90px",
            zIndex: activeStep === 4 ? 20 : 10,
            transform: activeStep === 4 ? "scale(1.1)" : "scale(1)",
          }}
        >
          {steps[3].number}
        </button>

        {/* Step 05 */}
        <button
          onClick={() => setActiveStep(5)}
          className={`absolute ${steps[4].color} text-white font-bold text-[30px] rounded-2xl shadow-lg hover:scale-102 transition-all duration-200 cursor-pointer flex items-center justify-center`}
          style={{
            top: "20px",
            left: "70%",
            width: "90px",
            height: "90px",
            zIndex: activeStep === 5 ? 20 : 10,
            transform: activeStep === 5 ? "scale(1.1)" : "scale(1)",
          }}
        >
          {steps[4].number}
        </button>

        {/* Step 06 */}
        <button
          onClick={() => setActiveStep(6)}
          className={`absolute ${steps[5].color} text-white font-bold text-[30px] rounded-2xl shadow-lg hover:scale-102 transition-all duration-200 cursor-pointer flex items-center justify-center`}
          style={{
            top: "105px",
            left: "85%",
            width: "90px",
            height: "90px",
            zIndex: activeStep === 6 ? 20 : 10,
            transform: activeStep === 6 ? "scale(1.1)" : "scale(1)",
          }}
        >
          {steps[5].number}
        </button>
      </div>

      {/* Active Step Content Card - Fixed Width */}
      <div
        className={`${steps[activeStep - 1].color} rounded-lg shadow-xl w-full max-w-[1200px] px-8 py-6 text-white transition-all duration-100`}
      >
        <div className="flex items-start gap-4 text-[18px] w-full">
          <div className="font-bold">{steps[activeStep - 1].number}.</div>
          <div className="flex-1">
            <h2 className="font-bold mb-3">{steps[activeStep - 1].title}</h2>
            <p className="text-sm text-white/95 leading-relaxed">
              {steps[activeStep - 1].description}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Hint */}
      <div className="text-center text-gray-400 text-sm">
        Click on any step above to view its details
      </div>
    </div>
  );
}

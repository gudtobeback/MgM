import React from "react";

export default function Footer() {
  const products = [
    {
      name: "Features",
      hash: "#features",
    },
    {
      name: "Pricing",
      hash: "#pricing",
    },
    {
      name: "How It Works",
      hash: "#how",
    },
    {
      name: "Documentation",
      hash: "#",
    },
    {
      name: "FAQ",
      hash: "#",
    },
  ];

  const companys = [
    {
      name: "About Us",
      hash: "#",
    },
    {
      name: "Contact",
      hash: "#",
    },
    {
      name: "Support",
      hash: "#",
    },
    {
      name: "Privacy Policy",
      hash: "#",
    },
    {
      name: "Terms Of Service",
      hash: "#",
    },
  ];

  return (
    <div>
      <div className="home-section">
        <div className="flex flex-col md:flex-row justify-around gap-6">
          <div className="flex flex-col gap-1">
            <div className="font-bold text-[24px] mb-1">Meraki Management</div>
            <p className="text-[12px] w-[300px]">
              A purpose-built operations platform for Cisco Meraki
              administrators. Scale, modernize, and automate your network
              management without the manual work.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="font-bold mb-1">Products</div>
            {products?.map((product, idx) => (
              <a
                key={idx}
                href={product?.hash}
                className="text-[12px] hover:text-blue-500"
              >
                {product?.name}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <div className="font-bold mb-1">Comapny</div>
            {companys?.map((company, idx) => (
              <a
                key={idx}
                href={company?.hash}
                className="text-[12px] hover:text-blue-500"
              >
                {company?.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px rounded-xl bg-gradient-to-r from-[#FAFAFA] via-[#049FD9] to-[#FAFAFA]"></div>

      <div className="py-4 text-center text-[12px]">
        © 2026 Meraki Management. All rights reserved.
      </div>
    </div>
  );
}

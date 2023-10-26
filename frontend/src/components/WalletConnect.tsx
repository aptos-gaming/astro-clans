import React from "react";
import { Row, Col } from "antd";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import CoinBalance from "./CoinBalance";

const WalletConnect = () => (
  <Row justify="space-between">
    <Col>
      <CoinBalance />
    </Col>
    <Col style={{ textAlign: "right" }}>
      <WalletSelector />
    </Col>
  </Row>
);

export default WalletConnect;

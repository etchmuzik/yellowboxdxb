
import { Layout } from "@/components/layout/Layout";
import { BikeTrackerContent } from "@/components/bike-tracker/BikeTrackerContent";
import { Helmet } from "react-helmet";

const BikeTracker = () => {
  return (
    <Layout>
      <Helmet>
        <title>Live Tracker | Yellow Box Dubai</title>
      </Helmet>
      <BikeTrackerContent />
    </Layout>
  );
};

export default BikeTracker;

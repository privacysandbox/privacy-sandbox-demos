public class HelpOption {
  public static void getHelp(){
    String helpOptions = "Usage: Aggregation Service Tools [options] \n"
        + "  Options: \n"
        + "    --request_type [request type]\n"
        + "      Type of request. Options available: \n"
        + "        convertToAvro: converts a json report to an avro aggregatable report \n"
        + "        convertToJson: converts the avro summary report to a json report \n"
        + "        createDomainAvro: creates an output_domain.avro file from provided bucket key\n\n"
        + "    --input_file [file name]\n"
        + "      This will be the file that will be encoded. \n\n"
        + "    --debug \n"
        + "      This will signify that the request is for debug. \n"
        + "      If the type of request is convertToAvro, this will create a debug avro report for local testing. \n\n"
        + "    --bucket_key [bucket key]\n"
        + "      Provide your bucket key here.\n\n"
        + "    --output_file [file name]\n"
        + "      Output filename the report will be written to.\n";
    System.out.println(helpOptions);
  }
}

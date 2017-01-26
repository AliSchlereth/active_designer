require 'json'
require 'active_designer/schema_creator.rb'

module ActiveDesigner
  class FileConverter

    def initialize(path)
      schema_file = File.read(path)
      schema = ActiveDesigner::SchemaCreator.new
      gems = `echo $GEM_HOME`
      @file_name = Dir.pwd.split('/')[-1]
      @path = gems.strip + "/gems/active-designer-1.1.4/lib"
      @tables = schema.format(schema_file)
      @schema = JSON.generate(@tables)
    end

    def self.template
      file = File.join( File.dirname(__FILE__), '/template.html.erb' )
      template = File.read(file)
      renderer = ERB.new(template)
    end

    def get_binding
      binding()
    end

  end
end
